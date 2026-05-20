using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Subscriptions.Commands;
using NP.Application.Subscriptions.Queries;
using NP.Domain.Clients.Repositories;

namespace NP.API.Endpoints.Subscriptions;

public static class SubscriptionEndpoints
{
    public static RouteGroupBuilder MapSubscriptionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", Subscribe).RequireAuthorization("ClientOnly").WithSummary("Subscribe to a plan");
        group.MapGet("/my", GetMy).RequireAuthorization("ClientOnly").WithSummary("Get my active subscription");
        group.MapGet("/", GetAll).RequireAuthorization("AdminOnly").WithSummary("Get all subscriptions");
        group.MapPut("/{id:guid}/cancel", Cancel).RequireAuthorization("ClientOnly").WithSummary("Cancel subscription");
        return group;
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Subscribe(
        [FromBody] SubscribeRequest request,
        ICommandHandler<CreateSubscriptionCommand, Guid> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new CreateSubscriptionCommand(client.Id, request.NutritionistId, request.NutritionPlanId,
                request.Type, DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<SubscriptionDto>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetActiveSubscriptionQuery, SubscriptionDto> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetActiveSubscriptionQuery(client.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<SubscriptionDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllSubscriptionsQuery, List<SubscriptionDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllSubscriptionsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Cancel(
        Guid id, ICommandHandler<CancelSubscriptionCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new CancelSubscriptionCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }
}

public sealed record SubscribeRequest(Guid? NutritionistId, Guid? NutritionPlanId, string Type);
