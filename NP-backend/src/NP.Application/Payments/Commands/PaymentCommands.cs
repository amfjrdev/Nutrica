using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Payments;
using NP.Domain.Payments.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Payments.Commands;

public sealed record CreatePaymentCommand(Guid ClientId, Guid SubscriptionId, decimal Amount, string Currency, string StripePaymentIntentId) : ICommand<Guid>;

public sealed record ConfirmPaymentCommand(string StripePaymentIntentId) : ICommand;

public sealed record FailPaymentCommand(string StripePaymentIntentId) : ICommand;

public sealed record ApprovePaymentCommand(Guid PaymentId) : ICommand;

internal sealed class CreatePaymentCommandHandler : ICommandHandler<CreatePaymentCommand, Guid>
{
    private readonly IPaymentRepository _repo;
    public CreatePaymentCommandHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result<Guid>> HandleAsync(CreatePaymentCommand command, CancellationToken cancellationToken = default)
    {
        var result = Payment.Create(command.ClientId, command.SubscriptionId, command.Amount, command.Currency, command.StripePaymentIntentId);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);
        return Result.Success(result.Value.Id);
    }
}

internal sealed class ConfirmPaymentCommandHandler : ICommandHandler<ConfirmPaymentCommand>
{
    private readonly IPaymentRepository _repo;
    public ConfirmPaymentCommandHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(ConfirmPaymentCommand command, CancellationToken cancellationToken = default)
    {
        var payment = await _repo.GetByStripePaymentIntentIdAsync(command.StripePaymentIntentId, cancellationToken);
        if (payment is null) return Result.Failure(PaymentErrors.NotFound);

        var result = payment.MarkAsPaid();
        if (result.IsFailure) return result;

        _repo.Update(payment);
        return Result.Success();
    }
}

internal sealed class FailPaymentCommandHandler : ICommandHandler<FailPaymentCommand>
{
    private readonly IPaymentRepository _repo;
    public FailPaymentCommandHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(FailPaymentCommand command, CancellationToken cancellationToken = default)
    {
        var payment = await _repo.GetByStripePaymentIntentIdAsync(command.StripePaymentIntentId, cancellationToken);
        if (payment is null) return Result.Failure(PaymentErrors.NotFound);

        var result = payment.MarkAsFailed();
        if (result.IsFailure) return result;

        _repo.Update(payment);
        return Result.Success();
    }
}

internal sealed class ApprovePaymentCommandHandler : ICommandHandler<ApprovePaymentCommand>
{
    private readonly IPaymentRepository _repo;
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly INutritionistRepository _nutritionistRepository;

    public ApprovePaymentCommandHandler(
        IPaymentRepository repo,
        ISubscriptionRepository subscriptionRepository,
        INutritionistRepository nutritionistRepository)
    {
        _repo = repo;
        _subscriptionRepository = subscriptionRepository;
        _nutritionistRepository = nutritionistRepository;
    }

    public async Task<Result> HandleAsync(ApprovePaymentCommand command, CancellationToken cancellationToken = default)
    {
        var payment = await _repo.GetByIdAsync(command.PaymentId, cancellationToken);
        if (payment is null) return Result.Failure(PaymentErrors.NotFound);

        var payResult = payment.MarkAsPaid();
        if (payResult.IsFailure) return payResult;
        _repo.Update(payment);

        var subscription = await _subscriptionRepository.GetByIdAsync(payment.SubscriptionId, cancellationToken);
        if (subscription is null) return Result.Failure(SubscriptionErrors.NotFound);

        // Always assign the single platform nutritionist for Personalized plans.
        // We look up by email so this is resilient to DB resets — no hardcoded GUID.
        // Falls back to any approved nutritionist, then any nutritionist, so the
        // client is never left unassigned even in misconfigured environments.
        if (subscription.Type == SubscriptionType.Personalized && subscription.NutritionistId is null)
        {
            const string PlatformNutritionistEmail = "nutritionist@nutrilife.com";
            var nutritionist = await _nutritionistRepository.GetByEmailAsync(PlatformNutritionistEmail, cancellationToken)
                            ?? (await _nutritionistRepository.GetAllAsync(cancellationToken))
                                   .FirstOrDefault(n => n.IsApproved)
                            ?? (await _nutritionistRepository.GetAllAsync(cancellationToken))
                                   .FirstOrDefault();
            if (nutritionist is not null)
                subscription.AssignNutritionist(nutritionist.Id);
        }

        var activateResult = subscription.Activate();
        if (activateResult.IsFailure) return activateResult;
        _subscriptionRepository.Update(subscription);

        return Result.Success();
    }
}
