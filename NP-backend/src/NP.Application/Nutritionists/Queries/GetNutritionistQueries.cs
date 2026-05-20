using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;

namespace NP.Application.Nutritionists.Queries;

public sealed record NutritionistDto(Guid Id, Guid UserId, string? Bio, string? Specialization, string? CertificateUrl, bool IsApproved);

public sealed record GetNutritionistByUserIdQuery(Guid UserId) : IQuery<NutritionistDto>;

public sealed record GetAllNutritionistsQuery : IQuery<List<NutritionistDto>>;

internal sealed class GetNutritionistByUserIdQueryHandler : IQueryHandler<GetNutritionistByUserIdQuery, NutritionistDto>
{
    private readonly INutritionistRepository _repo;
    public GetNutritionistByUserIdQueryHandler(INutritionistRepository repo) => _repo = repo;

    public async Task<Result<NutritionistDto>> HandleAsync(GetNutritionistByUserIdQuery query, CancellationToken cancellationToken = default)
    {
        var n = await _repo.GetByUserIdAsync(query.UserId, cancellationToken);
        if (n is null) return Result.Failure<NutritionistDto>(NutritionistErrors.NotFound);
        return Result.Success(new NutritionistDto(n.Id, n.UserId, n.Bio, n.Specialization, n.CertificateUrl, n.IsApproved));
    }
}

internal sealed class GetAllNutritionistsQueryHandler : IQueryHandler<GetAllNutritionistsQuery, List<NutritionistDto>>
{
    private readonly INutritionistRepository _repo;
    public GetAllNutritionistsQueryHandler(INutritionistRepository repo) => _repo = repo;

    public async Task<Result<List<NutritionistDto>>> HandleAsync(GetAllNutritionistsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetAllAsync(cancellationToken);
        return Result.Success(list.Select(n => new NutritionistDto(n.Id, n.UserId, n.Bio, n.Specialization, n.CertificateUrl, n.IsApproved)).ToList());
    }
}
