using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Feedbacks.Commands;
using NP.Application.Feedbacks.Queries;
using NP.Domain.Clients.Repositories;
using NP.Domain.Nutritionists.Repositories;

namespace NP.API.Endpoints.Feedbacks;

public static class FeedbackEndpoints
{
    public static RouteGroupBuilder MapFeedbackEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", Submit).RequireAuthorization("ClientOnly").WithSummary("Submit feedback for a nutrition plan");
        group.MapGet("/plan/{planId:guid}", GetByPlan).RequireAuthorization().WithSummary("Get feedbacks for a plan");
        group.MapGet("/my", GetMyAsNutritionist).RequireAuthorization("NutritionistOnly").WithSummary("Get all feedbacks on my plans");
        group.MapPost("/nutritionist", RateNutritionist).RequireAuthorization("ClientOnly").WithSummary("Rate a nutritionist");
        group.MapGet("/nutritionist/{nutritionistId:guid}/my", GetMyNutritionistRating).RequireAuthorization("ClientOnly").WithSummary("Get my rating for a nutritionist");
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

    private static async Task<Results<Ok<List<FeedbackDto>>, ProblemHttpResult>> GetMyAsNutritionist(
        IQueryHandler<GetFeedbacksByNutritionistQuery, List<FeedbackDto>> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetFeedbacksByNutritionistQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> RateNutritionist(
        [FromBody] RateNutritionistRequest request,
        ICommandHandler<RateNutritionistCommand, Guid> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new RateNutritionistCommand(client.Id, request.NutritionistId, request.Rating, request.Comment),
            cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<NutritionistRatingDto?>, ProblemHttpResult>> GetMyNutritionistRating(
        Guid nutritionistId,
        IQueryHandler<GetMyNutritionistRatingQuery, NutritionistRatingDto?> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetMyNutritionistRatingQuery(client.Id, nutritionistId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record SubmitFeedbackRequest(Guid NutritionPlanId, string Comment, int Rating);
public sealed record RateNutritionistRequest(Guid NutritionistId, int Rating, string Comment);
