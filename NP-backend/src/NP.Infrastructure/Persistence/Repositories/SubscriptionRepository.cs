using Microsoft.EntityFrameworkCore;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class SubscriptionRepository : Repository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Subscription?> GetActiveByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        var subs = await Context.Subscriptions
            .Where(s => s.ClientId == clientId &&
                s.Status == SubscriptionStatus.Active &&
                s.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        return subs.FirstOrDefault(s => s.Type == SubscriptionType.Personalized)
            ?? subs.FirstOrDefault(s => s.Type == SubscriptionType.Predefined)
            ?? subs.FirstOrDefault(s => s.Type == SubscriptionType.AI);
    }

    public async Task<Subscription?> GetActiveByClientIdAndTypeAsync(Guid clientId, SubscriptionType type, CancellationToken cancellationToken = default) =>
        await Context.Subscriptions
            .FirstOrDefaultAsync(s => s.ClientId == clientId && s.Type == type &&
                s.Status == SubscriptionStatus.Active &&
                s.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public async Task<Subscription?> GetPendingByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        var subs = await Context.Subscriptions
            .Where(s => s.ClientId == clientId &&
                s.Status == SubscriptionStatus.PendingApproval &&
                s.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        return subs.FirstOrDefault(s => s.Type == SubscriptionType.Personalized)
            ?? subs.FirstOrDefault(s => s.Type == SubscriptionType.Predefined)
            ?? subs.FirstOrDefault(s => s.Type == SubscriptionType.AI);
    }

    public async Task<Subscription?> GetPendingByClientIdAndTypeAsync(Guid clientId, SubscriptionType type, CancellationToken cancellationToken = default) =>
        await Context.Subscriptions
            .FirstOrDefaultAsync(s => s.ClientId == clientId && s.Type == type &&
                s.Status == SubscriptionStatus.PendingApproval &&
                s.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public async Task<bool> HasActiveOrPendingByTypeAsync(Guid clientId, SubscriptionType type, CancellationToken cancellationToken = default) =>
        await Context.Subscriptions
            .AnyAsync(s => s.ClientId == clientId && s.Type == type &&
                (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.PendingApproval) &&
                s.ExpiresAt > DateTime.UtcNow, cancellationToken);

    public async Task<List<Subscription>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Subscriptions.Where(s => s.ClientId == clientId).ToListAsync(cancellationToken);

    public async Task<List<Subscription>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Subscriptions.ToListAsync(cancellationToken);
}
