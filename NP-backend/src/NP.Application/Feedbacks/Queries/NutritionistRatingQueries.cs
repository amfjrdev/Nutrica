using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Application.Feedbacks.Queries;

public sealed record NutritionistRatingDto(Guid Id, Guid ClientId, Guid NutritionistId, int Rating, string Comment, DateTime CreatedAt);

public sealed record GetMyNutritionistRatingQuery(Guid ClientId, Guid NutritionistId) : IQuery<NutritionistRatingDto?>;

internal sealed class GetMyNutritionistRatingQueryHandler : IQueryHandler<GetMyNutritionistRatingQuery, NutritionistRatingDto?>
{
    private readonly INutritionistRatingRepository _repo;
    public GetMyNutritionistRatingQueryHandler(INutritionistRatingRepository repo) => _repo = repo;

    public async Task<Result<NutritionistRatingDto?>> HandleAsync(GetMyNutritionistRatingQuery query, CancellationToken cancellationToken = default)
    {
        var r = await _repo.GetByClientAndNutritionistAsync(query.ClientId, query.NutritionistId, cancellationToken);
        if (r is null) return Result.Success<NutritionistRatingDto?>(null);
        return Result.Success<NutritionistRatingDto?>(new NutritionistRatingDto(r.Id, r.ClientId, r.NutritionistId, r.Rating, r.Comment, r.CreatedAt));
    }
}
