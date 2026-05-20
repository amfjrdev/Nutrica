using NP.Domain.Abstractions;

namespace NP.Domain.Payments;

public sealed class Payment : Entity
{
    private Payment() { }

    private Payment(Guid id, Guid clientId, Guid subscriptionId, decimal amount, string currency, string stripePaymentIntentId)
        : base(id)
    {
        ClientId = clientId;
        SubscriptionId = subscriptionId;
        Amount = amount;
        Currency = currency;
        StripePaymentIntentId = stripePaymentIntentId;
        Status = PaymentStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid ClientId { get; private set; }
    public Guid SubscriptionId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public string StripePaymentIntentId { get; private set; } = string.Empty;
    public PaymentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? PaidAt { get; private set; }

    public static Result<Payment> Create(Guid clientId, Guid subscriptionId, decimal amount, string currency, string stripePaymentIntentId)
    {
        if (clientId == Guid.Empty) return Result.Failure<Payment>(PaymentErrors.InvalidClientId);
        if (amount <= 0) return Result.Failure<Payment>(PaymentErrors.InvalidAmount);
        if (string.IsNullOrWhiteSpace(stripePaymentIntentId)) return Result.Failure<Payment>(PaymentErrors.InvalidStripeId);

        return Result.Success(new Payment(Guid.NewGuid(), clientId, subscriptionId, amount, currency, stripePaymentIntentId));
    }

    public Result MarkAsPaid()
    {
        if (Status != PaymentStatus.Pending) return Result.Failure(PaymentErrors.AlreadyProcessed);
        Status = PaymentStatus.Succeeded;
        PaidAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result MarkAsFailed()
    {
        if (Status != PaymentStatus.Pending) return Result.Failure(PaymentErrors.AlreadyProcessed);
        Status = PaymentStatus.Failed;
        return Result.Success();
    }
}
