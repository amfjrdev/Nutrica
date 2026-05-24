using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;

namespace NP.Application.Nutritionists.Queries;

public sealed record NutritionistDto(
    Guid Id,
    Guid UserId,
    string? Bio,
    string? Specialization,
    string? CertificateUrl,
    bool IsApproved,
    double AverageRating = 0
);

public sealed record GetNutritionistByUserIdQuery(Guid UserId) : IQuery<NutritionistDto>;

public sealed record GetAllNutritionistsQuery : IQuery<List<NutritionistDto>>;

internal sealed class GetNutritionistByUserIdQueryHandler : IQueryHandler<GetNutritionistByUserIdQuery, NutritionistDto>
{
    private readonly INutritionistRepository _repo;
    private readonly INutritionistRatingRepository _ratingRepo;

    public GetNutritionistByUserIdQueryHandler(
        INutritionistRepository repo,
        INutritionistRatingRepository ratingRepo)
    {
        _repo = repo;
        _ratingRepo = ratingRepo;
    }

    public async Task<Result<NutritionistDto>> HandleAsync(GetNutritionistByUserIdQuery query, CancellationToken cancellationToken = default)
    {
        var n = await _repo.GetByUserIdAsync(query.UserId, cancellationToken);
        if (n is null) return Result.Failure<NutritionistDto>(NutritionistErrors.NotFound);

        var ratings = await _ratingRepo.GetByNutritionistIdAsync(n.Id, cancellationToken);
        var avgRating = ratings.Count > 0 ? Math.Round(ratings.Average(r => r.Rating), 1) : 0;

        return Result.Success(new NutritionistDto(n.Id, n.UserId, n.Bio, n.Specialization, n.CertificateUrl, n.IsApproved, avgRating));
    }
}

internal sealed class GetAllNutritionistsQueryHandler : IQueryHandler<GetAllNutritionistsQuery, List<NutritionistDto>>
{
    private readonly INutritionistRepository _repo;
    private readonly INutritionistRatingRepository _ratingRepo;

    public GetAllNutritionistsQueryHandler(
        INutritionistRepository repo,
        INutritionistRatingRepository ratingRepo)
    {
        _repo = repo;
        _ratingRepo = ratingRepo;
    }

    public async Task<Result<List<NutritionistDto>>> HandleAsync(GetAllNutritionistsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetAllAsync(cancellationToken);
        var dtos = new List<NutritionistDto>();

        foreach (var n in list)
        {
            var ratings = await _ratingRepo.GetByNutritionistIdAsync(n.Id, cancellationToken);
            var avgRating = ratings.Count > 0 ? Math.Round(ratings.Average(r => r.Rating), 1) : 0;
            dtos.Add(new NutritionistDto(n.Id, n.UserId, n.Bio, n.Specialization, n.CertificateUrl, n.IsApproved, avgRating));
        }

        return Result.Success(dtos);
    }
}
