using NP.Domain.Abstractions;

namespace NP.Domain.Nutritionists.Repositories;

public interface INutritionistRepository : IRepository<Nutritionist>
{
    Task<Nutritionist?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Nutritionist?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<List<Nutritionist>> GetAllAsync(CancellationToken cancellationToken = default);
}
