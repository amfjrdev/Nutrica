using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.NutritionPlans;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.NutritionPlans.Queries;

public sealed record NutritionPlanDto(
    Guid Id,
    Guid NutritionistId,
    Guid? ClientId,
    string Title,
    string Content,
    bool IsPredefined,
    string Status,
    string? RejectionReason,
    DateTime CreatedAt,
    double AverageRating = 0
);

public sealed record GetPlansByNutritionistQuery(Guid NutritionistId) : IQuery<List<NutritionPlanDto>>;

public sealed record GetPlansByClientQuery(Guid ClientId) : IQuery<List<NutritionPlanDto>>;

public sealed record GetPendingPlansQuery : IQuery<List<NutritionPlanDto>>;

public sealed record GetPredefinedPlansQuery : IQuery<List<NutritionPlanDto>>;

internal static class PlanMapper
{
    public static NutritionPlanDto ToDto(NutritionPlan p, double avgRating = 0) =>
        new(p.Id, p.NutritionistId, p.ClientId, p.Title, p.Content, p.IsPredefined, p.Status.ToString(), p.RejectionReason, p.CreatedAt, avgRating);
}

internal sealed class GetPlansByNutritionistQueryHandler : IQueryHandler<GetPlansByNutritionistQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    private readonly IFeedbackRepository _feedbackRepo;

    public GetPlansByNutritionistQueryHandler(INutritionPlanRepository repo, IFeedbackRepository feedbackRepo)
    {
        _repo = repo;
        _feedbackRepo = feedbackRepo;
    }

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPlansByNutritionistQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        var dtos = new List<NutritionPlanDto>();

        foreach (var p in list)
        {
            var feedbacks = await _feedbackRepo.GetByNutritionPlanIdAsync(p.Id, cancellationToken);
            var avgRating = feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 0;
            dtos.Add(PlanMapper.ToDto(p, avgRating));
        }

        return Result.Success(dtos);
    }
}

internal sealed class GetPlansByClientQueryHandler : IQueryHandler<GetPlansByClientQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    private readonly IFeedbackRepository _feedbackRepo;

    public GetPlansByClientQueryHandler(INutritionPlanRepository repo, IFeedbackRepository feedbackRepo)
    {
        _repo = repo;
        _feedbackRepo = feedbackRepo;
    }

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPlansByClientQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        var dtos = new List<NutritionPlanDto>();

        foreach (var p in list)
        {
            var feedbacks = await _feedbackRepo.GetByNutritionPlanIdAsync(p.Id, cancellationToken);
            var avgRating = feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 0;
            dtos.Add(PlanMapper.ToDto(p, avgRating));
        }

        return Result.Success(dtos);
    }
}

internal sealed class GetPendingPlansQueryHandler : IQueryHandler<GetPendingPlansQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    private readonly IFeedbackRepository _feedbackRepo;

    public GetPendingPlansQueryHandler(INutritionPlanRepository repo, IFeedbackRepository feedbackRepo)
    {
        _repo = repo;
        _feedbackRepo = feedbackRepo;
    }

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPendingPlansQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetPendingAsync(cancellationToken);
        var dtos = new List<NutritionPlanDto>();

        foreach (var p in list)
        {
            var feedbacks = await _feedbackRepo.GetByNutritionPlanIdAsync(p.Id, cancellationToken);
            var avgRating = feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 0;
            dtos.Add(PlanMapper.ToDto(p, avgRating));
        }

        return Result.Success(dtos);
    }
}

internal sealed class GetPredefinedPlansQueryHandler : IQueryHandler<GetPredefinedPlansQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    private readonly IFeedbackRepository _feedbackRepo;

    public GetPredefinedPlansQueryHandler(INutritionPlanRepository repo, IFeedbackRepository feedbackRepo)
    {
        _repo = repo;
        _feedbackRepo = feedbackRepo;
    }

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPredefinedPlansQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetPredefinedAsync(cancellationToken);
        var dtos = new List<NutritionPlanDto>();

        foreach (var p in list)
        {
            var feedbacks = await _feedbackRepo.GetByNutritionPlanIdAsync(p.Id, cancellationToken);
            var avgRating = feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 0;
            dtos.Add(PlanMapper.ToDto(p, avgRating));
        }

        return Result.Success(dtos);
    }
}
