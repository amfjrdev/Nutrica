using NP.Domain.Abstractions;

namespace NP.Domain.Posts;

public static class PostErrors
{
    public static readonly Error InvalidAuthorId = new("Post.InvalidAuthorId", "Author ID is invalid.");
    public static readonly Error InvalidTitle = new("Post.InvalidTitle", "Title is required.");
    public static readonly Error InvalidContent = new("Post.InvalidContent", "Content is required.");
    public static readonly Error NotFound = new("Post.NotFound", "Post not found.");
    public static readonly Error InvalidStatusTransition = new("Post.InvalidStatusTransition", "This status transition is not allowed.");
    public static readonly Error CannotEditApproved = new("Post.CannotEditApproved", "An approved post cannot be edited.");
}
