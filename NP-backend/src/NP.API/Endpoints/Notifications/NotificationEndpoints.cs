using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications.Commands;
using NP.Application.Notifications.Queries;

namespace NP.API.Endpoints.Notifications;

public static class NotificationEndpoints
{
    public static RouteGroupBuilder MapNotificationEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetMy).RequireAuthorization().WithSummary("Get my notifications");
        group.MapPut("/{id:guid}/read", MarkRead).RequireAuthorization().WithSummary("Mark notification as read");
        group.MapPost("/send", Send).RequireAuthorization("AdminOnly").WithSummary("Send a system notification to a user");
        return group;
    }

    private static async Task<Results<Ok<List<NotificationDto>>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetNotificationsByUserQuery, List<NotificationDto>> handler,
        IUserContext userContext, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetNotificationsByUserQuery(userContext.UserId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> MarkRead(
        Guid id, ICommandHandler<MarkNotificationReadCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new MarkNotificationReadCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Send(
        [FromBody] SendNotificationRequest request,
        ICommandHandler<SendNotificationCommand> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new SendNotificationCommand(request.UserId, request.Title, request.Message), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }
}

public sealed record SendNotificationRequest(Guid UserId, string Title, string Message);
