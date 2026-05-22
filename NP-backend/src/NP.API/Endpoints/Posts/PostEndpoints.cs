using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Posts.Commands;
using NP.Application.Posts.Queries;

namespace NP.API.Endpoints.Posts;

public static class PostEndpoints
{
    public static RouteGroupBuilder MapPostEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetApproved).AllowAnonymous().WithSummary("Get all approved posts");
        group.MapGet("/pending", GetPending).RequireAuthorization("AdminOnly").WithSummary("Get pending posts");
        group.MapGet("/all", GetAll).RequireAuthorization("AdminOnly").WithSummary("Get all posts (admin)");
        group.MapGet("/my", GetMy).RequireAuthorization().WithSummary("Get my posts");
        group.MapPost("/", Create).RequireAuthorization().WithSummary("Create a post")
            .WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(10 * 1024 * 1024));
        group.MapPut("/{id:guid}", Edit).RequireAuthorization().WithSummary("Edit a post");
        group.MapPut("/{id:guid}/approve", Approve).RequireAuthorization("AdminOnly").WithSummary("Approve a post");
        group.MapPut("/{id:guid}/reject", Reject).RequireAuthorization("AdminOnly").WithSummary("Reject a post");
        group.MapDelete("/{id:guid}", Delete).RequireAuthorization("AdminOnly").WithSummary("Delete a post");
        return group;
    }

    private static async Task<Results<Ok<List<PostDto>>, ProblemHttpResult>> GetApproved(
        IQueryHandler<GetApprovedPostsQuery, List<PostDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetApprovedPostsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<PostDto>>, ProblemHttpResult>> GetPending(
        IQueryHandler<GetPendingPostsQuery, List<PostDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetPendingPostsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<PostDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllPostsQuery, List<PostDto>> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllPostsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<PostDto>>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetPostsByAuthorQuery, List<PostDto>> handler,
        IUserContext userContext, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetPostsByAuthorQuery(userContext.UserId), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Create(
        [FromBody] CreatePostRequest request,
        ICommandHandler<CreatePostCommand, Guid> handler,
        IUserContext userContext, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(
            new CreatePostCommand(userContext.UserId, userContext.Role, request.Title, request.Content, request.ImageUrl),
            cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Edit(
        Guid id, [FromBody] EditPostRequest request,
        ICommandHandler<EditPostCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new EditPostCommand(id, request.Title, request.Content, request.ImageUrl), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Approve(
        Guid id, ICommandHandler<ApprovePostCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ApprovePostCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Reject(
        Guid id, [FromBody] RejectPostRequest request,
        ICommandHandler<RejectPostCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new RejectPostCommand(id, request.Reason), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(
        Guid id, ICommandHandler<DeletePostCommand> handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new DeletePostCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }
}

public sealed record CreatePostRequest(string Title, string Content, string? ImageUrl);
public sealed record EditPostRequest(string Title, string Content, string? ImageUrl);
public sealed record RejectPostRequest(string Reason);
