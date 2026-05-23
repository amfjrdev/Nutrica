using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.Feedbacks.Queries;

public sealed record FeedbackDto(Guid Id, Guid ClientId, Guid NutritionPlanId, string Comment, int Rating, DateTime CreatedAt);

public sealed record GetFeedbacksByPlanQuery(Guid NutritionPlanId) : IQuery<List<FeedbackDto>>;

public sealed record GetFeedbacksByNutritionistQuery(Guid NutritionistId) : IQuery<List<FeedbackDto>>;

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

internal sealed class GetFeedbacksByNutritionistQueryHandler : IQueryHandler<GetFeedbacksByNutritionistQuery, List<FeedbackDto>>
{
    private readonly IFeedbackRepository _feedbackRepo;
    private readonly INutritionPlanRepository _planRepo;

    public GetFeedbacksByNutritionistQueryHandler(IFeedbackRepository feedbackRepo, INutritionPlanRepository planRepo)
    {
        _feedbackRepo = feedbackRepo;
        _planRepo = planRepo;
    }

    public async Task<Result<List<FeedbackDto>>> HandleAsync(GetFeedbacksByNutritionistQuery query, CancellationToken cancellationToken = default)
    {
        var plans = await _planRepo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        var planIds = plans.Select(p => p.Id).ToHashSet();

        var allFeedbacks = new List<FeedbackDto>();
        foreach (var planId in planIds)
        {
            var feedbacks = await _feedbackRepo.GetByNutritionPlanIdAsync(planId, cancellationToken);
            allFeedbacks.AddRange(feedbacks.Select(f => new FeedbackDto(f.Id, f.ClientId, f.NutritionPlanId, f.Comment, f.Rating, f.CreatedAt)));
        }

        return Result.Success(allFeedbacks.OrderByDescending(f => f.CreatedAt).ToList());
    }
}
