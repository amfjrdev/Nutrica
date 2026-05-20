using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Feedbacks.Commands;
using NP.Application.Feedbacks.Queries;
using NP.Domain.Clients.Repositories;

namespace NP.API.Endpoints.Feedbacks;

public static class FeedbackEndpoints
{
    public static RouteGroupBuilder MapFeedbackEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", Submit).RequireAuthorization("ClientOnly").WithSummary("Submit feedback for a nutrition plan");
        group.MapGet("/plan/{planId:guid}", GetByPlan).RequireAuthorization().WithSummary("Get feedbacks for a plan");
        return group;
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Submit(
        [FromBody] SubmitFeedbackRequest request,
        ICommandHandler<SubmitFeedbackCommand, Guid> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new SubmitFeedbackCommand(client.Id, request.NutritionPlanId, request.Comment, request.Rating),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<FeedbackDto>>, ProblemHttpResult>> GetByPlan(
        Guid planId,
        IQueryHandler<GetFeedbacksByPlanQuery, List<FeedbackDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetFeedbacksByPlanQuery(planId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record SubmitFeedbackRequest(Guid NutritionPlanId, string Comment, int Rating);
