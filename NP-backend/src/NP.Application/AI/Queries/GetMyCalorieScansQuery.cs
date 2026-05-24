using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.CalorieScans.Repositories;
using System.Text.Json;

namespace NP.Application.AI.Queries;

public sealed record CalorieScanDto(
    Guid Id,
    string FoodName,
    int EstimatedCalories,
    double TotalFat,
    double TotalCarbs,
    double TotalProtein,
    int ItemsDetected,
    string Details,
    string OriginalImageBase64,
    string? SegmentedImageBase64,
    List<DetectedFoodItem> Foods,
    DateTime CreatedAt
);

public sealed record GetMyCalorieScansQuery(Guid ClientId) : IQuery<List<CalorieScanDto>>;

internal sealed class GetMyCalorieScansQueryHandler : IQueryHandler<GetMyCalorieScansQuery, List<CalorieScanDto>>
{
    private readonly ICalorieScanRepository _repo;

    public GetMyCalorieScansQueryHandler(ICalorieScanRepository repo) => _repo = repo;

    public async Task<Result<List<CalorieScanDto>>> HandleAsync(GetMyCalorieScansQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        var dtos = list.Select(s => new CalorieScanDto(
            s.Id,
            s.FoodName,
            s.EstimatedCalories,
            s.TotalFat,
            s.TotalCarbs,
            s.TotalProtein,
            s.ItemsDetected,
            s.Details,
            s.OriginalImageBase64,
            s.SegmentedImageBase64,
            JsonSerializer.Deserialize<List<DetectedFoodItem>>(s.FoodsJson) ?? new List<DetectedFoodItem>(),
            s.CreatedAt
        )).ToList();

        return Result.Success(dtos);
    }
}
