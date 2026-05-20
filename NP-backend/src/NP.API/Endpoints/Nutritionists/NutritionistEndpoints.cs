using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Nutritionists.Commands;
using NP.Application.Nutritionists.Queries;
namespace NP.API.Endpoints.Nutritionists;

public static class NutritionistEndpoints
{
    public static RouteGroupBuilder MapNutritionistEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetAll).RequireAuthorization().WithSummary("Get all nutritionists");
        group.MapGet("/me", GetMe).RequireAuthorization("NutritionistOnly").WithSummary("Get current nutritionist profile");
        group.MapPut("/profile", UpdateProfile).RequireAuthorization("NutritionistOnly").WithSummary("Update nutritionist profile");
        group.MapGet("/clients", GetClients).RequireAuthorization("NutritionistOnly").WithSummary("Get nutritionist's client list");
        group.MapGet("/clients/{clientId:guid}/questionnaire", GetClientQuestionnaire).RequireAuthorization("NutritionistOnly").WithSummary("Get client questionnaire");
        group.MapGet("/clients/{clientId:guid}/subscription", GetClientSubscription).RequireAuthorization("NutritionistOnly").WithSummary("Get client subscription type");
        group.MapGet("/clients/{clientId:guid}/feedbacks", GetClientFeedbacks).RequireAuthorization("NutritionistOnly").WithSummary("Get client feedbacks and ratings");
        group.MapGet("/chat-clients", GetPersonalizedClients).RequireAuthorization("NutritionistOnly").WithSummary("Get Personalized clients assigned to this nutritionist");
        return group;
    }

    private static async Task<Results<Ok<List<NutritionistDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllNutritionistsQuery, List<NutritionistDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllNutritionistsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<NutritionistDto>, ProblemHttpResult>> GetMe(
        IQueryHandler<GetNutritionistByUserIdQuery, NutritionistDto> handler,
        IUserContext userContext, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetNutritionistByUserIdQuery(userContext.UserId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        ICommandHandler<UpdateNutritionistProfileCommand> handler,
        IUserContext userContext,
        NP.Domain.Nutritionists.Repositories.INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new UpdateNutritionistProfileCommand(nutritionist.Id, request.Bio, request.Specialization, request.CertificateUrl),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<List<ClientSummaryDto>>, ProblemHttpResult>> GetClients(
        IQueryHandler<GetNutritionistClientsQuery, List<ClientSummaryDto>> handler,
        IUserContext userContext,
        NP.Domain.Nutritionists.Repositories.INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetNutritionistClientsQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ClientQuestionnaireDto>, ProblemHttpResult>> GetClientQuestionnaire(
        Guid clientId,
        IQueryHandler<GetClientQuestionnaireQuery, ClientQuestionnaireDto> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientQuestionnaireQuery(clientId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<ClientSubscriptionDto>, ProblemHttpResult>> GetClientSubscription(
        Guid clientId,
        IQueryHandler<GetClientSubscriptionTypeQuery, ClientSubscriptionDto> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientSubscriptionTypeQuery(clientId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<ClientFeedbackSummaryDto>>, ProblemHttpResult>> GetClientFeedbacks(
        Guid clientId,
        IQueryHandler<GetClientFeedbacksQuery, List<ClientFeedbackSummaryDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientFeedbacksQuery(clientId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<PersonalizedClientDto>>, ProblemHttpResult>> GetPersonalizedClients(
        IQueryHandler<GetNutritionistPersonalizedClientsQuery, List<PersonalizedClientDto>> handler,
        IUserContext userContext,
        NP.Domain.Nutritionists.Repositories.INutritionistRepository nutritionistRepository,
        CancellationToken cancellationToken)
    {
        var nutritionist = await nutritionistRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (nutritionist is null) return TypedResults.Problem(title: "Not Found", detail: "Nutritionist not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetNutritionistPersonalizedClientsQuery(nutritionist.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record UpdateProfileRequest(string Bio, string Specialization, string? CertificateUrl);
