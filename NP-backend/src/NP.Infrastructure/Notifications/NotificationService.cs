using Microsoft.AspNetCore.SignalR;
using NP.Application.Abstractions.Notifications;
using NP.Domain.Notifications;
using NP.Domain.Notifications.Repositories;

namespace NP.Infrastructure.Notifications;

/// <summary>
/// Marker interface so Infrastructure can push to the hub without referencing NP.API.
/// The concrete hub in NP.API implements this via IHubContext&lt;NotificationHub&gt;.
/// </summary>
public interface INotificationHubPusher
{
    Task PushToUserAsync(string userId, object payload, CancellationToken cancellationToken = default);
}

internal sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly INotificationHubPusher _pusher;

    public NotificationService(INotificationRepository repository, INotificationHubPusher pusher)
    {
        _repository = repository;
        _pusher = pusher;
    }

    public async Task SendAsync(NotificationPayload payload, CancellationToken cancellationToken = default)
    {
        var result = Notification.Create(
            payload.RecipientUserId, payload.Title, payload.Message,
            payload.Type, payload.SenderRole, payload.ReceiverRole);

        if (result.IsFailure) return;

        await _repository.AddAsync(result.Value, cancellationToken);

        await _pusher.PushToUserAsync(payload.RecipientUserId.ToString(), new
        {
            id           = result.Value.Id,
            title        = result.Value.Title,
            message      = result.Value.Message,
            type         = result.Value.Type.ToString().ToLowerInvariant(),
            senderRole   = result.Value.SenderRole,
            receiverRole = result.Value.ReceiverRole,
            createdAt    = result.Value.CreatedAt,
            isRead       = result.Value.IsRead
        }, cancellationToken);
    }

    public async Task SendManyAsync(IEnumerable<NotificationPayload> payloads,
        CancellationToken cancellationToken = default)
    {
        foreach (var payload in payloads)
            await SendAsync(payload, cancellationToken);
    }
}
