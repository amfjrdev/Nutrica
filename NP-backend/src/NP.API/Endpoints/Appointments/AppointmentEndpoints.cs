using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Appointments.Commands;
using NP.Application.Appointments.Queries;
using NP.Domain.Clients.Repositories;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Subscriptions.Repositories;

namespace NP.API.Endpoints.Appointments;

public static class AppointmentEndpoints
{
    public static RouteGroupBuilder MapAppointmentEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", Request).RequireAuthorization("ClientOnly").WithSummary("Request an appointment");
        group.MapGet("/my", GetMy).RequireAuthorization().WithSummary("Get my appointments");
        group.MapGet("/all", GetAll).RequireAuthorization("AdminOnly").WithSummary("Get all appointments (Admin)");
        group.MapGet("/dashboard", GetNutritionistDashboard).RequireAuthorization("NutritionistOnly").WithSummary("Get all appointments with client info (Nutritionist)");
        group.MapGet("/pending", GetPending).RequireAuthorization("NutritionistOnly").WithSummary("Get pending appointment requests");
        group.MapGet("/approved", GetApproved).RequireAuthorization("NutritionistOnly").WithSummary("Get approved appointments");
        group.MapGet("/calendar/{nutritionistId:guid}", GetCalendar).RequireAuthorization("ClientOnly").WithSummary("Get nutritionist calendar");
        group.MapGet("/available/{nutritionistId:guid}", GetAvailableSlots).RequireAuthorization("ClientOnly").WithSummary("Get available booking slots");
        group.MapPut("/{id:guid}/approve", Approve).RequireAuthorization("NutritionistOrAdmin").WithSummary("Approve appointment");
        group.MapPut("/{id:guid}/reject", Reject).RequireAuthorization("NutritionistOrAdmin").WithSummary("Reject appointment");
        group.MapPut("/{id:guid}/cancel", Cancel).RequireAuthorization().WithSummary("Cancel appointment");
        group.MapPut("/{id:guid}/attend", Attend).RequireAuthorization().WithSummary("Mark appointment as attended");
        return group;
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Request(
        [FromBody] RequestAppointmentRequest request,
        ICommandHandler<RequestAppointmentCommand, Guid> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new RequestAppointmentCommand(client.Id, request.NutritionistId, request.ScheduledAt, request.Notes),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<AppointmentDto>>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetAppointmentsByClientQuery, List<AppointmentDto>> clientHandler,
        IQueryHandler<GetAppointmentsByNutritionistQuery, List<AppointmentDto>> nutritionistHandler,
        IUserContext userContext,
        IClientRepository clientRepository,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is not null)
        {
            var r = await clientHandler.HandleAsync(new GetAppointmentsByClientQuery(client.Id), cancellationToken);
            return r.IsFailure ? r.Error.ToProblem() : TypedResults.Ok(r.Value);
        }

        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is not null)
        {
            var r = await nutritionistHandler.HandleAsync(new GetAppointmentsByNutritionistQuery(nutritionist.Id), cancellationToken);
            return r.IsFailure ? r.Error.ToProblem() : TypedResults.Ok(r.Value);
        }

        return TypedResults.Ok(new List<AppointmentDto>());
    }

    private static async Task<Results<Ok<List<AppointmentWithClientDto>>, ProblemHttpResult>> GetNutritionistDashboard(
        IQueryHandler<GetAppointmentsWithClientQuery, List<AppointmentWithClientDto>> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null)
            return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new GetAppointmentsWithClientQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<AppointmentDto>>, ProblemHttpResult>> GetPending(
        IQueryHandler<GetPendingAppointmentsQuery, List<AppointmentDto>> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetPendingAppointmentsQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Approve(
        Guid id, ICommandHandler<ApproveAppointmentCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ApproveAppointmentCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Reject(
        Guid id, [FromBody] RejectRequest request,
        ICommandHandler<RejectAppointmentCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new RejectAppointmentCommand(id, request.Reason), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Cancel(
        Guid id, ICommandHandler<CancelAppointmentCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new CancelAppointmentCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Attend(
        Guid id, ICommandHandler<AttendAppointmentCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new AttendAppointmentCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<List<AppointmentDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllAppointmentsQuery, List<AppointmentDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllAppointmentsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<AppointmentDto>>, ProblemHttpResult>> GetApproved(
        IQueryHandler<GetApprovedAppointmentsQuery, List<AppointmentDto>> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetApprovedAppointmentsQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<CalendarSlotDto>>, ProblemHttpResult>> GetCalendar(
        Guid nutritionistId,
        IQueryHandler<GetNutritionistCalendarQuery, List<CalendarSlotDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetNutritionistCalendarQuery(nutritionistId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<AvailableSlotDto>>, ProblemHttpResult>> GetAvailableSlots(
        Guid nutritionistId,
        IQueryHandler<GetAvailableSlotsQuery, List<AvailableSlotDto>> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        ISubscriptionRepository subscriptionRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var sub = await subscriptionRepository.GetActiveByClientIdAsync(client.Id, cancellationToken);
        if (sub is null || sub.Type != NP.Domain.Subscriptions.SubscriptionType.Personalized)
            return TypedResults.Problem(title: "Forbidden", detail: "Appointments require an active Personalized subscription.", statusCode: 403);

        var result = await handler.HandleAsync(new GetAvailableSlotsQuery(nutritionistId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record RequestAppointmentRequest(Guid NutritionistId, DateTime ScheduledAt, string? Notes);
public sealed record RejectRequest(string Reason);
