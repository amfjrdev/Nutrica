using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Messaging;
using NP.Application.AI.Commands;

namespace NP.API.Endpoints.AI;

public static class AIEndpoints
{
    public static RouteGroupBuilder MapAIEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/chat", Chat)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Send a message to the AI chatbott");

        group.MapPost("/estimate-calories", EstimateCalories)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Upload a food image and receive calorie estimation")
            .DisableAntiforgery();

        return group;
    }

    private static async Task<Results<Ok<string>, ProblemHttpResult>> Chat(
        [FromBody] ChatRequest request,
        ICommandHandler<AIChatCommand, string> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new AIChatCommand(request.Message), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CalorieEstimationResult>, ProblemHttpResult>> EstimateCalories(
        IFormFile image,
        ICommandHandler<EstimateCaloriesCommand, CalorieEstimationResult> handler,
        CancellationToken cancellationToken)
    {
        await using var stream = image.OpenReadStream();
        var result = await handler.HandleAsync(new EstimateCaloriesCommand(stream, image.FileName), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record ChatRequest(string Message);
