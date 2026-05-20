using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Posts;
using NP.Domain.Posts.Repositories;

namespace NP.Application.Posts.Commands;

public sealed record CreatePostCommand(Guid AuthorId, string AuthorRole, string Title, string Content, string? ImageUrl) : ICommand<Guid>;

public sealed record EditPostCommand(Guid PostId, string Title, string Content, string? ImageUrl) : ICommand;

public sealed record ApprovePostCommand(Guid PostId) : ICommand;

public sealed record RejectPostCommand(Guid PostId, string Reason) : ICommand;

// --- Handlers ---

internal sealed class CreatePostCommandHandler : ICommandHandler<CreatePostCommand, Guid>
{
    private readonly IPostRepository _repo;
    public CreatePostCommandHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result<Guid>> HandleAsync(CreatePostCommand command, CancellationToken cancellationToken = default)
    {
        var result = Post.Create(command.AuthorId, command.AuthorRole, command.Title, command.Content, command.ImageUrl);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);
        return Result.Success(result.Value.Id);
    }
}

internal sealed class EditPostCommandHandler : ICommandHandler<EditPostCommand>
{
    private readonly IPostRepository _repo;
    public EditPostCommandHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(EditPostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        var result = post.Edit(command.Title, command.Content, command.ImageUrl);
        if (result.IsFailure) return result;

        _repo.Update(post);
        return Result.Success();
    }
}

internal sealed class ApprovePostCommandHandler : ICommandHandler<ApprovePostCommand>
{
    private readonly IPostRepository _repo;
    public ApprovePostCommandHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(ApprovePostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        var result = post.Approve();
        if (result.IsFailure) return result;

        _repo.Update(post);
        return Result.Success();
    }
}

internal sealed class RejectPostCommandHandler : ICommandHandler<RejectPostCommand>
{
    private readonly IPostRepository _repo;
    public RejectPostCommandHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(RejectPostCommand command, CancellationToken cancellationToken = default)
    {
        var post = await _repo.GetByIdAsync(command.PostId, cancellationToken);
        if (post is null) return Result.Failure(PostErrors.NotFound);

        var result = post.Reject(command.Reason);
        if (result.IsFailure) return result;

        _repo.Update(post);
        return Result.Success();
    }
}
