using NP.Domain.Abstractions;

namespace NP.Domain.Feedbacks.Repositories;

public interface IFeedbackRepository : IRepository<Feedback>
{
    Task<List<Feedback>> GetByNutritionPlanIdAsync(Guid nutritionPlanId, CancellationToken cancellationToken = default);
    Task<List<Feedback>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
}
