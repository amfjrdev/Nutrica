using Microsoft.AspNetCore.Http.HttpResults;
using NP.Domain.Abstractions;

namespace NP.API.Extensions;

public static class ResultExtensions
{
    public static ProblemHttpResult ToProblem(this Error error)
    {
        var statusCode = error.Code switch
        {
            var c when c.Contains("NotFound")                                         => StatusCodes.Status404NotFound,
            var c when c.Contains("AlreadyExists") || c.Contains("AlreadyActive")
                    || c.Contains("SlotAlreadyTaken") || c.Contains("TooManyPending") => StatusCodes.Status409Conflict,
            var c when c.Contains("Unauthorized") || c.Contains("InvalidCredentials") => StatusCodes.Status401Unauthorized,
            var c when c.Contains("Forbidden") || c.Contains("PremiumRequired")       => StatusCodes.Status403Forbidden,
            var c when c.Contains("Suspended") || c.Contains("Inactive")              => StatusCodes.Status403Forbidden,
            // OTP: 401 for invalid/expired/max-attempts, 429 for resend cooldown
            var c when c.Contains("OtpInvalid") || c.Contains("OtpExpired")
                    || c.Contains("OtpMaxAttempts") || c.Contains("OtpNotPending")    => StatusCodes.Status401Unauthorized,
            var c when c.Contains("OtpResendTooSoon")                                 => StatusCodes.Status429TooManyRequests,
            // OtpRequired is a success-like signal (200) — handled at endpoint level
            _ => StatusCodes.Status400BadRequest
        };

        return TypedResults.Problem(
            title: GetTitle(statusCode),
            detail: error.Message,
            statusCode: statusCode,
            extensions: new Dictionary<string, object?> { ["code"] = error.Code });
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest   => "Bad Request",
        StatusCodes.Status401Unauthorized => "Unauthorized",
        StatusCodes.Status403Forbidden    => "Forbidden",
        StatusCodes.Status404NotFound     => "Not Found",
        StatusCodes.Status409Conflict     => "Conflict",
        StatusCodes.Status429TooManyRequests => "Too Many Requests",
        _ => "Request Failed"
    };
}
