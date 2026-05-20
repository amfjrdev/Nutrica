using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Application.Feedbacks.Queries;

public sealed record FeedbackDto(Guid Id, Guid ClientId, Guid NutritionPlanId, string Comment, int Rating, DateTime CreatedAt);

public sealed record GetFeedbacksByPlanQuery(Guid NutritionPlanId) : IQuery<List<FeedbackDto>>;

internal sealed class GetFeedbacksByPlanQueryHandler : IQueryHandler<GetFeedbacksByPlanQuery, List<FeedbackDto>>
{
    private readonly IFeedbackRepository _repo;
    public GetFeedbacksByPlanQueryHandler(IFeedbackRepository repo) => _repo = repo;

    public async Task<Result<List<FeedbackDto>>> HandleAsync(GetFeedbacksByPlanQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByNutritionPlanIdAsync(query.NutritionPlanId, cancellationToken);
        return Result.Success(list.Select(f => new FeedbackDto(f.Id, f.ClientId, f.NutritionPlanId, f.Comment, f.Rating, f.CreatedAt)).ToList());
    }
}
