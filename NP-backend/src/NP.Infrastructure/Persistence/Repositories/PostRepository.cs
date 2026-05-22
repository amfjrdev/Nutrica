using Microsoft.EntityFrameworkCore;
using NP.Domain.Posts;
using NP.Domain.Posts.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class PostRepository : Repository<Post>, IPostRepository
{
    public PostRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<Post>> GetApprovedAsync(CancellationToken cancellationToken = default) =>
        await Context.Posts.Where(p => p.Status == PostStatus.Approved).ToListAsync(cancellationToken);

    public async Task<List<Post>> GetPendingAsync(CancellationToken cancellationToken = default) =>
        await Context.Posts.Where(p => p.Status == PostStatus.PendingApproval).ToListAsync(cancellationToken);

    public async Task<List<Post>> GetByAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default) =>
        await Context.Posts.Where(p => p.AuthorId == authorId).ToListAsync(cancellationToken);

    public async Task<List<Post>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Posts.OrderByDescending(p => p.CreatedAt).ToListAsync(cancellationToken);
}
