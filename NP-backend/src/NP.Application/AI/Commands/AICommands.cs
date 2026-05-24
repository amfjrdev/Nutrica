using System.Text.Json;
using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.CalorieScans;
using NP.Domain.CalorieScans.Repositories;

namespace NP.Application.AI.Commands;

public sealed record AIChatCommand(string Message) : ICommand<string>;

public sealed record EstimateCaloriesCommand(Guid ClientId, Stream ImageStream, string FileName) : ICommand<CalorieEstimationResult>;

internal sealed class AIChatCommandHandler : ICommandHandler<AIChatCommand, string>
{
    private readonly IAIService _aiService;
    public AIChatCommandHandler(IAIService aiService) => _aiService = aiService;

    public async Task<Result<string>> HandleAsync(AIChatCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Message))
            return Result.Failure<string>(new Error("AI.EmptyMessage", "Message cannot be empty."));

        if (command.Message.Length > 1000)
            return Result.Failure<string>(new Error("AI.MessageTooLong", "Message must be 1000 characters or fewer."));

        var response = await _aiService.ChatAsync(command.Message, cancellationToken);
        return Result.Success(response);
    }
}

internal sealed class EstimateCaloriesCommandHandler : ICommandHandler<EstimateCaloriesCommand, CalorieEstimationResult>
{
    private readonly IAIService _aiService;
    private readonly ICalorieScanRepository _scanRepository;

    public EstimateCaloriesCommandHandler(IAIService aiService, ICalorieScanRepository scanRepository)
    {
        _aiService = aiService;
        _scanRepository = scanRepository;
    }

    public async Task<Result<CalorieEstimationResult>> HandleAsync(EstimateCaloriesCommand command, CancellationToken cancellationToken = default)
    {
        // 1. Read the image stream and convert to Base64 to save it permanently
        using var ms = new MemoryStream();
        await command.ImageStream.CopyToAsync(ms, cancellationToken);
        var base64Original = Convert.ToBase64String(ms.ToArray());

        // Reset the memory stream so the AI service can read it
        ms.Position = 0;

        // 2. Query the AI calorie estimation service
        var result = await _aiService.EstimateCaloriesAsync(ms, command.FileName, cancellationToken);

        // 3. Serialize detected food breakdown items
        var foodsJson = JsonSerializer.Serialize(result.Foods ?? new List<DetectedFoodItem>());

        // 4. Save to the database for persistence
        var scan = CalorieScan.Create(
            command.ClientId,
            result.FoodName,
            result.EstimatedCalories,
            result.TotalFat,
            result.TotalCarbs,
            result.TotalProtein,
            result.ItemsDetected,
            result.Details,
            base64Original,
            result.SegmentedImage,
            foodsJson
        );

        await _scanRepository.AddAsync(scan, cancellationToken);

        // Return the estimation result completed with the generated DB ID
        return Result.Success(result with { Id = scan.Id });
    }
}
