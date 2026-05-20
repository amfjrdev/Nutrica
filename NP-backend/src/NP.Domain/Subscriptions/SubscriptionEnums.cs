namespace NP.Domain.Subscriptions;

public enum SubscriptionType
{
    Predefined,
    AI,
    Personalized
}

public enum SubscriptionStatus
{
    PendingApproval,
    Active,
    Expired,
    Cancelled
}
