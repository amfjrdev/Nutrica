using Microsoft.EntityFrameworkCore;
using NP.Domain.Feedbacks;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class NutritionistRatingRepository : Repository<NutritionistRating>, INutritionistRatingRepository
{
    public NutritionistRatingRepository(ApplicationDbContext context) : base(context) { }

    public Task<NutritionistRating?> GetByClientAndNutritionistAsync(Guid clientId, Guid nutritionistId, CancellationToken cancellationToken = default) =>
        Context.Set<NutritionistRating>()
            .FirstOrDefaultAsync(r => r.ClientId == clientId && r.NutritionistId == nutritionistId, cancellationToken);

    public Task<List<NutritionistRating>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default) =>
        Context.Set<NutritionistRating>()
            .Where(r => r.NutritionistId == nutritionistId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
}
