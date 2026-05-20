using NP.Application.Abstractions.Messaging;
using NP.Application.NutritionPlans.Queries;
using NP.Domain.Abstractions;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.NutritionPlans.Queries;

public sealed record GetMyPlansAsClientQuery(Guid ClientId) : IQuery<List<NutritionPlanDto>>;

internal sealed class GetMyPlansAsClientQueryHandler : IQueryHandler<GetMyPlansAsClientQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    public GetMyPlansAsClientQueryHandler(INutritionPlanRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetMyPlansAsClientQuery query, CancellationToken cancellationToken = default)
    {
        var plans = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(plans.Select(PlanMapper.ToDto).ToList());
    }
}
