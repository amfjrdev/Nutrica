using NP.Domain.Abstractions;

namespace NP.Domain.Posts;

public sealed class Post : Entity
{
    private Post() { }

    private Post(Guid id, Guid authorId, string authorRole, string title, string content)
        : base(id)
    {
        AuthorId = authorId;
        AuthorRole = authorRole;
        Title = title;
        Content = content;
        Status = PostStatus.PendingApproval;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid AuthorId { get; private set; }
    public string AuthorRole { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public string? RejectionReason { get; private set; }
    public PostStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public static Result<Post> Create(Guid authorId, string authorRole, string title, string content, string? imageUrl = null)
    {
        if (authorId == Guid.Empty) return Result.Failure<Post>(PostErrors.InvalidAuthorId);
        if (string.IsNullOrWhiteSpace(title)) return Result.Failure<Post>(PostErrors.InvalidTitle);
        if (string.IsNullOrWhiteSpace(content)) return Result.Failure<Post>(PostErrors.InvalidContent);

        var post = new Post(Guid.NewGuid(), authorId, authorRole, title, content);
        post.ImageUrl = imageUrl;
        return Result.Success(post);
    }

    public Result Edit(string title, string content, string? imageUrl = null)
    {
        if (Status == PostStatus.Approved) return Result.Failure(PostErrors.CannotEditApproved);
        if (string.IsNullOrWhiteSpace(title)) return Result.Failure(PostErrors.InvalidTitle);
        if (string.IsNullOrWhiteSpace(content)) return Result.Failure(PostErrors.InvalidContent);

        Title = title;
        Content = content;
        ImageUrl = imageUrl;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Approve()
    {
        if (Status != PostStatus.PendingApproval) return Result.Failure(PostErrors.InvalidStatusTransition);
        Status = PostStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject(string reason)
    {
        if (Status != PostStatus.PendingApproval) return Result.Failure(PostErrors.InvalidStatusTransition);
        Status = PostStatus.Rejected;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
