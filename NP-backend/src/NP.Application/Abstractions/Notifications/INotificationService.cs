using NP.Domain.Notifications;

namespace NP.Application.Abstractions.Notifications;

public sealed record NotificationPayload(
    Guid RecipientUserId,
    string Title,
    string Message,
    NotificationType Type,
    string SenderRole,
    string ReceiverRole);

public interface INotificationService
{
    Task SendAsync(NotificationPayload payload, CancellationToken cancellationToken = default);
    Task SendManyAsync(IEnumerable<NotificationPayload> payloads, CancellationToken cancellationToken = default);
}
