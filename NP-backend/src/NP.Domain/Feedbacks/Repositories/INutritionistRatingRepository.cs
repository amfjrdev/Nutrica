using NP.Domain.Abstractions;

namespace NP.Domain.Feedbacks.Repositories;

public interface INutritionistRatingRepository : IRepository<NutritionistRating>
{
    Task<NutritionistRating?> GetByClientAndNutritionistAsync(Guid clientId, Guid nutritionistId, CancellationToken cancellationToken = default);
    Task<List<NutritionistRating>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default);
}
