using NP.Application.Abstractions.Messaging;
using NP.Application.NutritionPlans.Queries;
using NP.Domain.Abstractions;
using NP.Domain.NutritionPlans;
using NP.Domain.NutritionPlans.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.NutritionPlans.Queries;

public sealed record GetMyPlansAsClientQuery(Guid ClientId) : IQuery<List<NutritionPlanDto>>;

internal sealed class GetMyPlansAsClientQueryHandler : IQueryHandler<GetMyPlansAsClientQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    private readonly ISubscriptionRepository _subscriptionRepository;

    public GetMyPlansAsClientQueryHandler(
        INutritionPlanRepository repo,
        ISubscriptionRepository subscriptionRepository)
    {
        _repo = repo;
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetMyPlansAsClientQuery query, CancellationToken cancellationToken = default)
    {
        // 1. Fetch custom plans explicitly assigned to the client
        var customPlans = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);

        // 2. Fetch active predefined plan IDs from the client's subscriptions
        var clientSubs = await _subscriptionRepository.GetByClientIdAsync(query.ClientId, cancellationToken);
        var activePredefinedPlanIds = clientSubs
            .Where(s => s.Status == SubscriptionStatus.Active && s.Type == SubscriptionType.Predefined && s.NutritionPlanId.HasValue)
            .Select(s => s.NutritionPlanId!.Value)
            .ToList();

        // 3. Fetch all predefined plans and filter to those the client has unlocked
        var predefinedPlans = await _repo.GetPredefinedAsync(cancellationToken);
        var unlockedPredefined = predefinedPlans
            .Where(p => activePredefinedPlanIds.Contains(p.Id))
            .ToList();

        // 4. Combine and return
        var allPlans = customPlans.Concat(unlockedPredefined).ToList();
        return Result.Success(allPlans.Select(PlanMapper.ToDto).ToList());
    }
}
