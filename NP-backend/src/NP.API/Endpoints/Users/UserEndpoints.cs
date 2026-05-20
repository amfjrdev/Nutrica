using Microsoft.AspNetCore.Http.HttpResults;
using NP.API.Extensions;
using NP.Application.Abstractions.Messaging;
using NP.Application.Users.Commands;
using NP.Application.Users.Queries;

namespace NP.API.Endpoints.Users;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetAll).RequireAuthorization("AdminOnly").WithSummary("Get all users");
        group.MapPut("/{id:guid}/suspend", Suspend).RequireAuthorization("AdminOnly").WithSummary("Suspend a user");
        group.MapPut("/{id:guid}/activate", Activate).RequireAuthorization("AdminOnly").WithSummary("Activate a user");
        return group;
    }

    private static async Task<Results<Ok<List<UserDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllUsersQuery, List<UserDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllUsersQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Suspend(
        Guid id, ICommandHandler<SuspendUserCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new SuspendUserCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Activate(
        Guid id, ICommandHandler<ActivateUserCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ActivateUserCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }
}
