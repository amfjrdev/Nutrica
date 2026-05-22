using NP.Domain.Abstractions;

namespace NP.Domain.Posts.Repositories;

public interface IPostRepository : IRepository<Post>
{
    Task<List<Post>> GetApprovedAsync(CancellationToken cancellationToken = default);
    Task<List<Post>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<List<Post>> GetByAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task<List<Post>> GetAllAsync(CancellationToken cancellationToken = default);
}
