using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Posts;
using NP.Domain.Posts.Repositories;

namespace NP.Application.Posts.Queries;

public sealed record PostDto(Guid Id, Guid AuthorId, string AuthorRole, string Title, string Content, string? ImageUrl, string Status, DateTime CreatedAt);

public sealed record GetApprovedPostsQuery : IQuery<List<PostDto>>;

internal static class PostMapper
{
    public static PostDto ToDto(Post p) =>
        new(p.Id, p.AuthorId, p.AuthorRole, p.Title, p.Content, p.ImageUrl, p.Status.ToString(), p.CreatedAt);
}

internal sealed class GetApprovedPostsQueryHandler : IQueryHandler<GetApprovedPostsQuery, List<PostDto>>
{
    private readonly IPostRepository _repo;
    public GetApprovedPostsQueryHandler(IPostRepository repo) => _repo = repo;

    public async Task<Result<List<PostDto>>> HandleAsync(GetApprovedPostsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetApprovedAsync(cancellationToken);
        return Result.Success(list.Select(PostMapper.ToDto).ToList());
    }
}
