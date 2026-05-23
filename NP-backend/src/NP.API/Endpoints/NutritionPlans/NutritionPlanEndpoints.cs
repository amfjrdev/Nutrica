using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.NutritionPlans.Commands;
using NP.Application.NutritionPlans.Queries;
using NP.Domain.Clients.Repositories;
using NP.Domain.Nutritionists.Repositories;

namespace NP.API.Endpoints.NutritionPlans;

public static class NutritionPlanEndpoints
{
    public static RouteGroupBuilder MapNutritionPlanEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", Create).RequireAuthorization("NutritionistOnly").WithSummary("Create a nutrition plan");
        group.MapPut("/{id:guid}", Update).RequireAuthorization("NutritionistOnly").WithSummary("Update a nutrition plan");
        group.MapGet("/my", GetMy).RequireAuthorization("NutritionistOnly").WithSummary("Get my nutrition plans (Nutritionist)");
        group.MapGet("/client/my", GetMyAsClient).RequireAuthorization("ClientOnly").WithSummary("Get my nutrition plans (Client)");
        group.MapGet("/predefined", GetPredefined).RequireAuthorization().WithSummary("Get predefined plans");
        group.MapPut("/{id:guid}/select", SelectPredefined).RequireAuthorization("ClientOnly").WithSummary("Select a predefined plan");
        group.MapGet("/pending", GetPending).RequireAuthorization("AdminOnly").WithSummary("Get pending plans for approval");
        group.MapPut("/{id:guid}/approve", Approve).RequireAuthorization("AdminOnly").WithSummary("Approve a nutrition plan");
        group.MapPut("/{id:guid}/reject", Reject).RequireAuthorization("AdminOnly").WithSummary("Reject a nutrition plan");
        return group;
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Create(
        [FromBody] CreatePlanRequest request,
        ICommandHandler<CreateNutritionPlanCommand, Guid> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new CreateNutritionPlanCommand(nutritionist.Id, request.ClientId, request.Title, request.Content, request.IsPredefined),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value );
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Update(
        Guid id, [FromBody] UpdatePlanRequest request,
        ICommandHandler<UpdateNutritionPlanCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new UpdateNutritionPlanCommand(id, request.Title, request.Content), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<List<NutritionPlanDto>>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetPlansByNutritionistQuery, List<NutritionPlanDto>> handler,
        IUserContext userContext,
        INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetPlansByNutritionistQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<NutritionPlanDto>>, ProblemHttpResult>> GetPredefined(
        IQueryHandler<GetPredefinedPlansQuery, List<NutritionPlanDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetPredefinedPlansQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<NutritionPlanDto>>, ProblemHttpResult>> GetPending(
        IQueryHandler<GetPendingPlansQuery, List<NutritionPlanDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetPendingPlansQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Approve(
        Guid id, ICommandHandler<ApproveNutritionPlanCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ApproveNutritionPlanCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Reject(
        Guid id, [FromBody] RejectPlanRequest request,
        ICommandHandler<RejectNutritionPlanCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new RejectNutritionPlanCommand(id, request.Reason), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> SelectPredefined(
        Guid id,
        ICommandHandler<SelectPredefinedPlanCommand> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new SelectPredefinedPlanCommand(client.Id, id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<List<NutritionPlanDto>>, ProblemHttpResult>> GetMyAsClient(
        IQueryHandler<GetMyPlansAsClientQuery, List<NutritionPlanDto>> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetMyPlansAsClientQuery(client.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record CreatePlanRequest(Guid? ClientId, string Title, string Content, bool IsPredefined);
public sealed record UpdatePlanRequest(string Title, string Content);
public sealed record RejectPlanRequest(string Reason);
