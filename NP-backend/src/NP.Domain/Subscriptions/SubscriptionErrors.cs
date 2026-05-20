using NP.Domain.Abstractions;

namespace NP.Domain.Subscriptions;

public static class SubscriptionErrors
{
    public static readonly Error InvalidClientId = new("Subscription.InvalidClientId", "Client ID is invalid.");
    public static readonly Error InvalidDates = new("Subscription.InvalidDates", "Expiry date must be after start date.");
    public static readonly Error NotFound = new("Subscription.NotFound", "Subscription not found.");
    public static readonly Error NotActive = new("Subscription.NotActive", "Subscription is not active.");
    public static readonly Error NotPendingApproval = new("Subscription.NotPendingApproval", "Subscription is not pending approval.");
    public static readonly Error AlreadyActive = new("Subscription.AlreadyActive", "Client already has an active subscription.");
}
