using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.CalorieScans.Repositories;
using System.Text.Json;

namespace NP.Application.AI.Commands;

public sealed record UpdateCalorieScanCommand(Guid ScanId, List<DetectedFoodItem> Foods) : ICommand<CalorieEstimationResult>;

internal sealed class UpdateCalorieScanCommandHandler : ICommandHandler<UpdateCalorieScanCommand, CalorieEstimationResult>
{
    private readonly ICalorieScanRepository _repo;

    public UpdateCalorieScanCommandHandler(ICalorieScanRepository repo) => _repo = repo;

    public async Task<Result<CalorieEstimationResult>> HandleAsync(UpdateCalorieScanCommand command, CancellationToken cancellationToken = default)
    {
        var scan = await _repo.GetByIdAsync(command.ScanId, cancellationToken);
        if (scan is null) return Result.Failure<CalorieEstimationResult>(new Error("CalorieScan.NotFound", "Scan history not found."));

        // Update foods list
        scan.FoodsJson = JsonSerializer.Serialize(command.Foods);

        // Recalculate totals
        scan.EstimatedCalories = (int)Math.Round(command.Foods.Sum(f => f.Calories));
        scan.TotalFat = command.Foods.Sum(f => f.FatG);
        scan.TotalCarbs = command.Foods.Sum(f => f.CarbsG);
        scan.TotalProtein = command.Foods.Sum(f => f.ProteinG);

        _repo.Update(scan);

        return Result.Success(new CalorieEstimationResult(
            FoodName: scan.FoodName,
            EstimatedCalories: scan.EstimatedCalories,
            Details: scan.Details,
            TotalFat: scan.TotalFat,
            TotalCarbs: scan.TotalCarbs,
            TotalProtein: scan.TotalProtein,
            ItemsDetected: scan.ItemsDetected,
            Foods: command.Foods,
            SegmentedImage: scan.SegmentedImageBase64,
            Id: scan.Id
        ));
    }
}
