using NP.Domain.Abstractions;

namespace NP.Domain.Subscriptions.Repositories;

public interface ISubscriptionRepository : IRepository<Subscription>
{
    Task<Subscription?> GetActiveByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<Subscription?> GetPendingByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveOrPendingByTypeAsync(Guid clientId, SubscriptionType type, CancellationToken cancellationToken = default);
    Task<List<Subscription>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<List<Subscription>> GetAllAsync(CancellationToken cancellationToken = default);
}
