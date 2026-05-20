using NP.Domain.Abstractions;

namespace NP.Domain.Notifications;

public enum NotificationType { Info, Success, Warning, Error }

public sealed class Notification : Entity
{
    private Notification() { }

    private Notification(Guid id, Guid userId, string title, string message,
        NotificationType type, string senderRole, string receiverRole) : base(id)
    {
        UserId = userId;
        Title = title;
        Message = message;
        Type = type;
        SenderRole = senderRole;
        ReceiverRole = receiverRole;
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public NotificationType Type { get; private set; }
    public string SenderRole { get; private set; } = string.Empty;
    public string ReceiverRole { get; private set; } = string.Empty;
    public bool IsRead { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Result<Notification> Create(Guid userId, string title, string message,
        NotificationType type = NotificationType.Info,
        string senderRole = "", string receiverRole = "")
    {
        if (userId == Guid.Empty) return Result.Failure<Notification>(NotificationErrors.InvalidUserId);
        if (string.IsNullOrWhiteSpace(title)) return Result.Failure<Notification>(NotificationErrors.InvalidTitle);

        return Result.Success(new Notification(Guid.NewGuid(), userId, title, message, type, senderRole, receiverRole));
    }

    public void MarkAsRead() => IsRead = true;
}
