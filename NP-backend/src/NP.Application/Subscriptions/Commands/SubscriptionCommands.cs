using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Subscriptions.Commands;

public sealed record CreateSubscriptionCommand(Guid ClientId, Guid? NutritionistId, Guid? NutritionPlanId, string Type, DateTime StartsAt, DateTime ExpiresAt) : ICommand<Guid>;

public sealed record CancelSubscriptionCommand(Guid SubscriptionId) : ICommand;

internal sealed class CreateSubscriptionCommandHandler : ICommandHandler<CreateSubscriptionCommand, Guid>
{
    private readonly ISubscriptionRepository _repo;
    public CreateSubscriptionCommandHandler(ISubscriptionRepository repo) => _repo = repo;

    public async Task<Result<Guid>> HandleAsync(CreateSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetActiveByClientIdAsync(command.ClientId, cancellationToken);
        if (existing is not null) return Result.Failure<Guid>(SubscriptionErrors.AlreadyActive);

        if (!Enum.TryParse<SubscriptionType>(command.Type, out var type))
            return Result.Failure<Guid>(new Error("Subscription.InvalidType", "Invalid subscription type."));

        var result = Subscription.Create(command.ClientId, command.NutritionistId, command.NutritionPlanId, type, command.StartsAt, command.ExpiresAt);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);
        return Result.Success(result.Value.Id);
    }
}

internal sealed class CancelSubscriptionCommandHandler : ICommandHandler<CancelSubscriptionCommand>
{
    private readonly ISubscriptionRepository _repo;
    public CancelSubscriptionCommandHandler(ISubscriptionRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(CancelSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        var sub = await _repo.GetByIdAsync(command.SubscriptionId, cancellationToken);
        if (sub is null) return Result.Failure(SubscriptionErrors.NotFound);

        var result = sub.Cancel();
        if (result.IsFailure) return result;

        _repo.Update(sub);
        return Result.Success();
    }
}
