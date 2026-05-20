using NP.Domain.Abstractions;

namespace NP.Domain.NutritionPlans.Repositories;

public interface INutritionPlanRepository : IRepository<NutritionPlan>
{
    Task<List<NutritionPlan>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default);
    Task<List<NutritionPlan>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<List<NutritionPlan>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<List<NutritionPlan>> GetPredefinedAsync(CancellationToken cancellationToken = default);
}
