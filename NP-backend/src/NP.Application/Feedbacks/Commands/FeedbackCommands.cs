using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Application.Feedbacks.Commands;

public sealed record SubmitFeedbackCommand(Guid ClientId, Guid NutritionPlanId, string Comment, int Rating) : ICommand<Guid>;

internal sealed class SubmitFeedbackCommandHandler : ICommandHandler<SubmitFeedbackCommand, Guid>
{
    private readonly IFeedbackRepository _repo;
    public SubmitFeedbackCommandHandler(IFeedbackRepository repo) => _repo = repo;

    public async Task<Result<Guid>> HandleAsync(SubmitFeedbackCommand command, CancellationToken cancellationToken = default)
    {
        var result = Feedback.Create(command.ClientId, command.NutritionPlanId, command.Comment, command.Rating);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);
        return Result.Success(result.Value.Id);
    }
}
