using Microsoft.AspNetCore.SignalR;
using NP.Infrastructure.Notifications;

namespace NP.API.Hubs;

internal sealed class NotificationHubPusher : INotificationHubPusher
{
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationHubPusher(IHubContext<NotificationHub> hub) => _hub = hub;

    public Task PushToUserAsync(string userId, object payload, CancellationToken cancellationToken = default) =>
        _hub.Clients
            .Group(NotificationHub.UserGroup(userId))
            .SendAsync("ReceiveNotification", payload, cancellationToken);
}
