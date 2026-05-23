namespace NP.Application.Abstractions.AI;

public interface IAIService
{
    Task<string> ChatAsync(string message, CancellationToken cancellationToken = default);
    Task<CalorieEstimationResult> EstimateCaloriesAsync(Stream imageStream, string fileName, CancellationToken cancellationToken = default);
}

public sealed record CalorieEstimationResult(
    string        FoodName,
    int           EstimatedCalories,
    string        Details,
    double        TotalFat      = 0,
    double        TotalCarbs    = 0,
    double        TotalProtein  = 0,
    int           ItemsDetected = 0,
    List<DetectedFoodItem>? Foods = null,
    string?       SegmentedImage = null
);

public sealed record DetectedFoodItem(
    string Name,
    double Confidence,
    double WeightG,
    double Calories,
    double FatG,
    double CarbsG,
    double ProteinG,
    string Source
);
