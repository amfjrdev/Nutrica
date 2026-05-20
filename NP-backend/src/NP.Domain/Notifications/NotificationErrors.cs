using NP.Domain.Abstractions;

namespace NP.Domain.Notifications;

public static class NotificationErrors
{
    public static readonly Error InvalidUserId = new("Notification.InvalidUserId", "User ID is invalid.");
    public static readonly Error InvalidTitle = new("Notification.InvalidTitle", "Title is required.");
    public static readonly Error NotFound = new("Notification.NotFound", "Notification not found.");
}
