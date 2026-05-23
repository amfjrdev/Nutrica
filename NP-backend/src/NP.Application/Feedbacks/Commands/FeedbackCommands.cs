using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.Feedbacks.Commands;

public sealed record SubmitFeedbackCommand(Guid ClientId, Guid NutritionPlanId, string Comment, int Rating) : ICommand<Guid>;

internal sealed class SubmitFeedbackCommandHandler : ICommandHandler<SubmitFeedbackCommand, Guid>
{
    private readonly IFeedbackRepository _repo;
    private readonly INutritionPlanRepository _planRepo;
    private readonly NotificationDispatcher _dispatcher;

    public SubmitFeedbackCommandHandler(IFeedbackRepository repo, INutritionPlanRepository planRepo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _planRepo = planRepo;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(SubmitFeedbackCommand command, CancellationToken cancellationToken = default)
    {
        var result = Feedback.Create(command.ClientId, command.NutritionPlanId, command.Comment, command.Rating);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        var plan = await _planRepo.GetByIdAsync(command.NutritionPlanId, cancellationToken);
        if (plan is not null)
        {
            var nutritionistUserId = await _dispatcher.GetNutritionistUserIdAsync(plan.NutritionistId, cancellationToken);
            if (nutritionistUserId.HasValue)
                await _dispatcher.NutritionistUpdatedAsync(nutritionistUserId.Value,
                    "New Plan Feedback",
                    $"A client rated your plan '{plan.Title}' {command.Rating}/5 stars.", cancellationToken);
        }

        return Result.Success(result.Value.Id);
    }
}
