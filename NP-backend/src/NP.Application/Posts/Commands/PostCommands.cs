using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Posts;
using NP.Domain.Posts.Repositories;

namespace NP.Application.Posts.Commands;

public sealed record CreatePostCommand(Guid AuthorId, string AuthorRole, string Title, string Content, string? ImageUrl) : ICommand<Guid>;

public sealed record ApprovePostCommand(Guid PostId) : ICommand;

public sealed record RejectPostCommand(Guid PostId, string Reason) : ICommand;

public sealed record DeletePostCommand(Guid PostId) : ICommand;

internal sealed class CreatePostCommandHandler : ICommandHandler<CreatePostCommand, Guid>
{
    private readonly IPostRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public CreatePostCommandHandler(IPostRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(CreatePostCommand command, CancellationToken cancellationToken = default)
    {
        var result = Post.Create(command.AuthorId, command.AuthorRole, command.Title, command.Content, command.ImageUrl);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        await _dispatcher.ClientActedAsync(null,
            "New Article Submitted",
            $"A {command.AuthorRole} submitted a new article '{command.Title}' for approval.", cancellationToken);

        return Result.Success(result.Value.Id);
    }
}

internal sealed class ApprovePostCommandHandler : ICommandHandler<ApprovePostCommand>
{
    private readonly IPostRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public ApprovePostCommandHandler(IPostRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(ApprovePostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        var result = post.Approve();
        if (result.IsFailure) return result;

        _repo.Update(post);

        await _dispatcher.AdminApprovedAsync(post.AuthorId,
            "Article Approved",
            $"Your article '{post.Title}' has been approved and is now published.", cancellationToken);

        return Result.Success();
    }
}

internal sealed class RejectPostCommandHandler : ICommandHandler<RejectPostCommand>
{
    private readonly IPostRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public RejectPostCommandHandler(IPostRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(RejectPostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        var result = post.Reject(command.Reason);
        if (result.IsFailure) return result;

        _repo.Update(post);

        await _dispatcher.AdminRejectedAsync(post.AuthorId,
            "Article Rejected",
            $"Your article '{post.Title}' was rejected. Reason: {command.Reason}", cancellationToken);

        return Result.Success();
    }
}

internal sealed class DeletePostCommandHandler : ICommandHandler<DeletePostCommand>
{
    private readonly IPostRepository _repo;
    public DeletePostCommandHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(DeletePostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        _repo.Remove(post);
        return Result.Success();
    }
}
