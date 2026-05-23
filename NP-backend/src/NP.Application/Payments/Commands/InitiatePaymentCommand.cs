using NP.Application.Abstractions.Messaging;
using NP.Application.Abstractions.Stripe;
using NP.Domain.Abstractions;
using NP.Domain.Clients.Repositories;
using NP.Domain.Payments;
using NP.Domain.Payments.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Payments.Commands;

public sealed record InitiatePaymentCommand(
    Guid ClientId,
    Guid? NutritionistId,
    Guid? NutritionPlanId,
    string SubscriptionType,
    decimal Amount,
    string Currency
) : ICommand<InitiatePaymentResult>;

public sealed record InitiatePaymentResult(Guid PaymentId, Guid SubscriptionId, string ClientSecret);

internal sealed class InitiatePaymentCommandHandler : ICommandHandler<InitiatePaymentCommand, InitiatePaymentResult>
{
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IStripeService _stripeService;

    public InitiatePaymentCommandHandler(
        ISubscriptionRepository subscriptionRepository,
        IPaymentRepository paymentRepository,
        IStripeService stripeService)
    {
        _subscriptionRepository = subscriptionRepository;
        _paymentRepository = paymentRepository;
        _stripeService = stripeService;
    }

    public async Task<Result<InitiatePaymentResult>> HandleAsync(InitiatePaymentCommand command, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<SubscriptionType>(command.SubscriptionType, out var subType))
            return Result.Failure<InitiatePaymentResult>(new Error("Subscription.InvalidType", "Invalid subscription type."));


        var startsAt = DateTime.UtcNow;
        var expiresAt = startsAt.AddMonths(1);

        var subResult = Subscription.Create(command.ClientId, command.NutritionistId, command.NutritionPlanId, subType, startsAt, expiresAt);
        if (subResult.IsFailure) return Result.Failure<InitiatePaymentResult>(subResult.Error);

        await _subscriptionRepository.AddAsync(subResult.Value, cancellationToken);

        var stripeResult = await _stripeService.CreatePaymentIntentAsync(command.Amount, command.Currency,
            $"Subscription {subType} for client {command.ClientId}", cancellationToken);

        var paymentResult = Payment.Create(command.ClientId, subResult.Value.Id, command.Amount, command.Currency, stripeResult.PaymentIntentId);
        if (paymentResult.IsFailure) return Result.Failure<InitiatePaymentResult>(paymentResult.Error);

        await _paymentRepository.AddAsync(paymentResult.Value, cancellationToken);

        return Result.Success(new InitiatePaymentResult(paymentResult.Value.Id, subResult.Value.Id, stripeResult.ClientSecret));
    }
}
