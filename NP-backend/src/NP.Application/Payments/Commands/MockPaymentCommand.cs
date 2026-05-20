using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Payments;
using NP.Domain.Payments.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Payments.Commands;

public sealed record MockPaymentCommand(
    Guid ClientId,
    string SubscriptionType,
    decimal Amount,
    string Currency
) : ICommand<Guid>;

internal sealed class MockPaymentCommandHandler : ICommandHandler<MockPaymentCommand, Guid>
{
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IPaymentRepository _paymentRepository;

    public MockPaymentCommandHandler(
        ISubscriptionRepository subscriptionRepository,
        IPaymentRepository paymentRepository)
    {
        _subscriptionRepository = subscriptionRepository;
        _paymentRepository      = paymentRepository;
    }

    public async Task<Result<Guid>> HandleAsync(MockPaymentCommand command, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<SubscriptionType>(command.SubscriptionType, out var subType))
            return Result.Failure<Guid>(new Error("Subscription.InvalidType", "Invalid subscription type."));

        var existing = await _subscriptionRepository.GetActiveByClientIdAsync(command.ClientId, cancellationToken);
        if (existing is not null) return Result.Failure<Guid>(SubscriptionErrors.AlreadyActive);

        var pendingExisting = await _subscriptionRepository.GetPendingByClientIdAsync(command.ClientId, cancellationToken);
        if (pendingExisting is not null) return Result.Failure<Guid>(SubscriptionErrors.AlreadyActive);

        var startsAt  = DateTime.UtcNow;
        var expiresAt = startsAt.AddMonths(1);

        // Subscription starts as PendingApproval — no features are unlocked until
        // an admin approves the payment via PUT /api/payments/{id}/approve.
        var subResult = Subscription.Create(command.ClientId, null, null, subType, startsAt, expiresAt);
        if (subResult.IsFailure) return Result.Failure<Guid>(subResult.Error);

        await _subscriptionRepository.AddAsync(subResult.Value, cancellationToken);

        // Payment stays Pending — admin approval triggers MarkAsPaid + Activate.
        var fakeStripeId  = $"mock_{Guid.NewGuid():N}";
        var paymentResult = Payment.Create(command.ClientId, subResult.Value.Id, command.Amount, command.Currency, fakeStripeId);
        if (paymentResult.IsFailure) return Result.Failure<Guid>(paymentResult.Error);

        await _paymentRepository.AddAsync(paymentResult.Value, cancellationToken);

        return Result.Success(paymentResult.Value.Id);
    }
}
