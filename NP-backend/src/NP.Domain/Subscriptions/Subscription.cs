using NP.Domain.Abstractions;

namespace NP.Domain.Subscriptions;

public sealed class Subscription : Entity
{
    private Subscription() { }

    private Subscription(Guid id, Guid clientId, Guid? nutritionistId, Guid? nutritionPlanId,
        SubscriptionType type, DateTime startsAt, DateTime expiresAt)
        : base(id)
    {
        ClientId = clientId;
        NutritionistId = nutritionistId;
        NutritionPlanId = nutritionPlanId;
        Type = type;
        Status = SubscriptionStatus.PendingApproval;
        StartsAt = startsAt;
        ExpiresAt = expiresAt;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid ClientId { get; private set; }
    public Guid? NutritionistId { get; private set; }
    public Guid? NutritionPlanId { get; private set; }
    public SubscriptionType Type { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime StartsAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Result<Subscription> Create(Guid clientId, Guid? nutritionistId, Guid? nutritionPlanId,
        SubscriptionType type, DateTime startsAt, DateTime expiresAt)
    {
        if (clientId == Guid.Empty) return Result.Failure<Subscription>(SubscriptionErrors.InvalidClientId);
        if (expiresAt <= startsAt) return Result.Failure<Subscription>(SubscriptionErrors.InvalidDates);

        return Result.Success(new Subscription(Guid.NewGuid(), clientId, nutritionistId, nutritionPlanId, type, startsAt, expiresAt));
    }

    public Result Activate()
    {
        if (Status != SubscriptionStatus.PendingApproval) return Result.Failure(SubscriptionErrors.NotPendingApproval);
        Status = SubscriptionStatus.Active;
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status != SubscriptionStatus.Active) return Result.Failure(SubscriptionErrors.NotActive);
        Status = SubscriptionStatus.Cancelled;
        return Result.Success();
    }

    public Result Expire()
    {
        if (Status != SubscriptionStatus.Active) return Result.Failure(SubscriptionErrors.NotActive);
        Status = SubscriptionStatus.Expired;
        return Result.Success();
    }

    public void AssignNutritionist(Guid nutritionistId)
    {
        if (NutritionistId is null)
            NutritionistId = nutritionistId;
    }
}
