using Microsoft.EntityFrameworkCore;
using NP.Domain.NutritionPlans;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class NutritionPlanRepository : Repository<NutritionPlan>, INutritionPlanRepository
{
    public NutritionPlanRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<NutritionPlan>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default) =>
        await Context.NutritionPlans.Where(n => n.NutritionistId == nutritionistId).ToListAsync(cancellationToken);

    public async Task<List<NutritionPlan>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.NutritionPlans.Where(n => n.ClientId == clientId).ToListAsync(cancellationToken);

    public async Task<List<NutritionPlan>> GetPendingAsync(CancellationToken cancellationToken = default) =>
        await Context.NutritionPlans.Where(n => n.Status == NutritionPlanStatus.PendingApproval).ToListAsync(cancellationToken);

    public async Task<List<NutritionPlan>> GetPredefinedAsync(CancellationToken cancellationToken = default) =>
        await Context.NutritionPlans.Where(n => n.IsPredefined && n.Status == NutritionPlanStatus.Approved).ToListAsync(cancellationToken);
}
