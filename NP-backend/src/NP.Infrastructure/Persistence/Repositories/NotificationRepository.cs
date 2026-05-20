using Microsoft.EntityFrameworkCore;
using NP.Domain.Notifications;
using NP.Domain.Notifications.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<Notification>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await Context.Notifications.Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt).ToListAsync(cancellationToken);

    public async Task<List<Notification>> GetUnreadByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await Context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync(cancellationToken);
}
