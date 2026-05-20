using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace NP.API.Middleware;

public sealed class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, code, message) = exception switch
        {
            // ── Concurrency: DB unique-constraint violation (double-booking race) ──
            // EF Core wraps SQL unique index violations in DbUpdateException.
            // We catch it here and return 409 so the client gets a clean error
            // instead of a 500, completing the two-layer concurrency defence.
            DbUpdateException dbEx when IsUniqueConstraintViolation(dbEx) =>
                (HttpStatusCode.Conflict, "Conflict",
                 "This time slot was just booked by someone else. Please choose a different slot."),

            ArgumentException or ArgumentNullException =>
                (HttpStatusCode.BadRequest, "BadRequest", exception.Message),

            UnauthorizedAccessException =>
                (HttpStatusCode.Unauthorized, "Unauthorized", "You are not authorized."),

            KeyNotFoundException =>
                (HttpStatusCode.NotFound, "NotFound", exception.Message),

            _ => (HttpStatusCode.InternalServerError, "InternalServerError",
                  _env.IsDevelopment() ? exception.Message : "An unexpected error occurred.")
        };

        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(
            new { code, message },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(json);
    }

    // SQL Server error 2601 = unique index violation, 2627 = unique constraint violation.
    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException?.Message ?? string.Empty;
        return inner.Contains("2601") || inner.Contains("2627") ||
               inner.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
               inner.Contains("duplicate", StringComparison.OrdinalIgnoreCase);
    }
}
