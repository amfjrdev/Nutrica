using Microsoft.EntityFrameworkCore;
using NP.Domain.Feedbacks;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class FeedbackRepository : Repository<Feedback>, IFeedbackRepository
{
    public FeedbackRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<Feedback>> GetByNutritionPlanIdAsync(Guid nutritionPlanId, CancellationToken cancellationToken = default) =>
        await Context.Feedbacks.Where(f => f.NutritionPlanId == nutritionPlanId).ToListAsync(cancellationToken);

    public async Task<List<Feedback>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Feedbacks.Where(f => f.ClientId == clientId).ToListAsync(cancellationToken);
}
