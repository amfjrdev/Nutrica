using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.NutritionPlans;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.NutritionPlans.Queries;

public sealed record NutritionPlanDto(Guid Id, Guid NutritionistId, Guid? ClientId, string Title, string Content, bool IsPredefined, string Status, string? RejectionReason, DateTime CreatedAt);

public sealed record GetPlansByNutritionistQuery(Guid NutritionistId) : IQuery<List<NutritionPlanDto>>;

public sealed record GetPlansByClientQuery(Guid ClientId) : IQuery<List<NutritionPlanDto>>;

public sealed record GetPendingPlansQuery : IQuery<List<NutritionPlanDto>>;

public sealed record GetPredefinedPlansQuery : IQuery<List<NutritionPlanDto>>;

internal static class PlanMapper
{
    public static NutritionPlanDto ToDto(NutritionPlan p) =>
        new(p.Id, p.NutritionistId, p.ClientId, p.Title, p.Content, p.IsPredefined, p.Status.ToString(), p.RejectionReason, p.CreatedAt);
}

internal sealed class GetPlansByNutritionistQueryHandler : IQueryHandler<GetPlansByNutritionistQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    public GetPlansByNutritionistQueryHandler(INutritionPlanRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPlansByNutritionistQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        return Result.Success(list.Select(PlanMapper.ToDto).ToList());
    }
}

internal sealed class GetPlansByClientQueryHandler : IQueryHandler<GetPlansByClientQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    public GetPlansByClientQueryHandler(INutritionPlanRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPlansByClientQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(list.Select(PlanMapper.ToDto).ToList());
    }
}

internal sealed class GetPendingPlansQueryHandler : IQueryHandler<GetPendingPlansQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    public GetPendingPlansQueryHandler(INutritionPlanRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPendingPlansQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetPendingAsync(cancellationToken);
        return Result.Success(list.Select(PlanMapper.ToDto).ToList());
    }
}

internal sealed class GetPredefinedPlansQueryHandler : IQueryHandler<GetPredefinedPlansQuery, List<NutritionPlanDto>>
{
    private readonly INutritionPlanRepository _repo;
    public GetPredefinedPlansQueryHandler(INutritionPlanRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionPlanDto>>> HandleAsync(GetPredefinedPlansQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetPredefinedAsync(cancellationToken);
        return Result.Success(list.Select(PlanMapper.ToDto).ToList());
    }
}
