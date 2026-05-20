using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;

namespace NP.Application.AI.Commands;

public sealed record AIChatCommand(string Message) : ICommand<string>;

public sealed record EstimateCaloriesCommand(Stream ImageStream, string FileName) : ICommand<CalorieEstimationResult>;

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
    public EstimateCaloriesCommandHandler(IAIService aiService) => _aiService = aiService;

    public async Task<Result<CalorieEstimationResult>> HandleAsync(EstimateCaloriesCommand command, CancellationToken cancellationToken = default)
    {
        var result = await _aiService.EstimateCaloriesAsync(command.ImageStream, command.FileName, cancellationToken);
        return Result.Success(result);
    }
}
