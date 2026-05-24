using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.AI.Commands;
using NP.Application.AI.Queries;
using NP.Domain.Clients.Repositories;

namespace NP.API.Endpoints.AI;

public static class AIEndpoints
{
    public static RouteGroupBuilder MapAIEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/chat", Chat)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Send a message to the AI chatbot");

        group.MapPost("/estimate-calories", EstimateCalories)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Upload a food image and receive calorie estimation")
            .DisableAntiforgery();

        group.MapGet("/calorie-scans", GetMyScans)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Get recent calorie scans history for client");

        group.MapPut("/calorie-scans/{id:guid}", UpdateScan)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Update a calorie scan breakdown item");

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
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        if (image is null || image.Length == 0)
            return TypedResults.Problem(title: "Bad Request", detail: "No image file provided.", statusCode: 400);

        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null)
            return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        await using var stream = image.OpenReadStream();
        var result = await handler.HandleAsync(new EstimateCaloriesCommand(client.Id, stream, image.FileName), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<CalorieScanDto>>, ProblemHttpResult>> GetMyScans(
        IQueryHandler<GetMyCalorieScansQuery, List<CalorieScanDto>> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null)
            return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetMyCalorieScansQuery(client.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CalorieEstimationResult>, ProblemHttpResult>> UpdateScan(
        Guid id,
        [FromBody] UpdateScanRequest request,
        ICommandHandler<UpdateCalorieScanCommand, CalorieEstimationResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new UpdateCalorieScanCommand(id, request.Foods), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record ChatRequest(string Message);
public sealed record UpdateScanRequest(List<DetectedFoodItem> Foods);
