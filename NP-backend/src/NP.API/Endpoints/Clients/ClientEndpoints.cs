using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Clients.Commands;
using NP.Application.Clients.Queries;

namespace NP.API.Endpoints.Clients;

public static class ClientEndpoints
{
    public static RouteGroupBuilder MapClientEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/me", GetMe).RequireAuthorization("ClientOnly").WithSummary("Get current client profile");
        group.MapGet("/access", GetAccess).RequireAuthorization("ClientOnly").WithSummary("Get client access level (subscription status + feature flags)");
        group.MapPut("/questionnaire", FillQuestionnaire).RequireAuthorization("ClientOnly").WithSummary("Fill nutrition questionnaire");
        return group;
    }

    private static async Task<Results<Ok<ClientDto>, ProblemHttpResult>> GetMe(
        IQueryHandler<GetClientByUserIdQuery, ClientDto> handler,
        IUserContext userContext,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientByUserIdQuery(userContext.UserId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ClientAccessDto>, ProblemHttpResult>> GetAccess(
        IQueryHandler<GetClientAccessQuery, ClientAccessDto> handler,
        IUserContext userContext,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientAccessQuery(userContext.UserId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> FillQuestionnaire(
        [FromBody] FillQuestionnaireRequest request,
        ICommandHandler<FillQuestionnaireCommand> handler,
        IUserContext userContext,
        NP.Domain.Clients.Repositories.IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null) return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new FillQuestionnaireCommand(client.Id, request.Goal, request.MedicalConditions, request.FoodAllergies,
                request.ActivityLevel, request.Weight, request.Height, request.Age, request.Gender),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }
}

public sealed record FillQuestionnaireRequest(string Goal, string? MedicalConditions, string? FoodAllergies,
    string ActivityLevel, decimal Weight, decimal Height, int Age, string Gender);
