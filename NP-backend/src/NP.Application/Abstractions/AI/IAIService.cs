namespace NP.Application.Abstractions.AI;

public interface IAIService
{
    Task<string> ChatAsync(string message, CancellationToken cancellationToken = default);
    Task<CalorieEstimationResult> EstimateCaloriesAsync(Stream imageStream, string fileName, CancellationToken cancellationToken = default);
}

public sealed record CalorieEstimationResult(string FoodName, int EstimatedCalories, string Details);
