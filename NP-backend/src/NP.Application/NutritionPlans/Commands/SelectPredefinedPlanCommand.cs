using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.NutritionPlans.Commands;

public sealed record SelectPredefinedPlanCommand(Guid ClientId, Guid PlanId) : ICommand;

internal sealed class SelectPredefinedPlanCommandHandler : ICommandHandler<SelectPredefinedPlanCommand>
{
    private readonly ISubscriptionRepository _subscriptionRepo;

    public SelectPredefinedPlanCommandHandler(ISubscriptionRepository subscriptionRepo)
        => _subscriptionRepo = subscriptionRepo;

    public async Task<Result> HandleAsync(SelectPredefinedPlanCommand command, CancellationToken cancellationToken = default)
    {
        var sub = await _subscriptionRepo.GetActiveByClientIdAsync(command.ClientId, cancellationToken);
        if (sub is null) return Result.Failure(new Error("Subscription.NotFound", "No active subscription found."));

        var result = sub.SelectPredefinedPlan(command.PlanId);
        if (result.IsFailure) return result;

        _subscriptionRepo.Update(sub);
        return Result.Success();
    }
}
