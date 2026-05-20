using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.NutritionPlans;
using NP.Domain.NutritionPlans.Repositories;

namespace NP.Application.NutritionPlans.Commands;

public sealed record CreateNutritionPlanCommand(Guid NutritionistId, Guid? ClientId, string Title, string Content, bool IsPredefined) : ICommand<Guid>;

public sealed record UpdateNutritionPlanCommand(Guid PlanId, string Title, string Content) : ICommand;

public sealed record ApproveNutritionPlanCommand(Guid PlanId) : ICommand;

public sealed record RejectNutritionPlanCommand(Guid PlanId, string Reason) : ICommand;

// --- Handlers ---

internal sealed class CreateNutritionPlanCommandHandler : ICommandHandler<CreateNutritionPlanCommand, Guid>
{
    private readonly INutritionPlanRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public CreateNutritionPlanCommandHandler(INutritionPlanRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(CreateNutritionPlanCommand command, CancellationToken cancellationToken = default)
    {
        var result = NutritionPlan.Create(command.NutritionistId, command.ClientId, command.Title, command.Content, command.IsPredefined);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        // Notify admins that a new plan was submitted for approval
        var nutritionistUserId = await _dispatcher.GetNutritionistUserIdAsync(command.NutritionistId, cancellationToken);
        await _dispatcher.ClientActedAsync(null,
            "New Nutrition Plan Submitted",
            $"A nutritionist submitted a new plan '{command.Title}' for approval.", cancellationToken);

        return Result.Success(result.Value.Id);
    }
}

internal sealed class UpdateNutritionPlanCommandHandler : ICommandHandler<UpdateNutritionPlanCommand>
{
    private readonly INutritionPlanRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public UpdateNutritionPlanCommandHandler(INutritionPlanRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(UpdateNutritionPlanCommand command, CancellationToken cancellationToken = default)
    {
        var plan = await _repo.GetByIdAsync(command.PlanId, cancellationToken);
        if (plan is null) return Result.Failure(NutritionPlanErrors.NotFound);

        var result = plan.Update(command.Title, command.Content);
        if (result.IsFailure) return result;

        _repo.Update(plan);

        // Notify client if this plan is assigned to one
        if (plan.ClientId.HasValue)
        {
            var clientUserId = await _dispatcher.GetClientUserIdAsync(plan.ClientId.Value, cancellationToken);
            if (clientUserId.HasValue)
                await _dispatcher.NutritionistUpdatedAsync(clientUserId.Value,
                    "Nutrition Plan Updated",
                    $"Your nutrition plan '{plan.Title}' has been updated.", cancellationToken);
        }

        return Result.Success();
    }
}

internal sealed class ApproveNutritionPlanCommandHandler : ICommandHandler<ApproveNutritionPlanCommand>
{
    private readonly INutritionPlanRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public ApproveNutritionPlanCommandHandler(INutritionPlanRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(ApproveNutritionPlanCommand command, CancellationToken cancellationToken = default)
    {
        var plan = await _repo.GetByIdAsync(command.PlanId, cancellationToken);
        if (plan is null) return Result.Failure(NutritionPlanErrors.NotFound);

        var result = plan.Approve();
        if (result.IsFailure) return result;

        _repo.Update(plan);

        if (plan.ClientId.HasValue)
        {
            var clientUserId = await _dispatcher.GetClientUserIdAsync(plan.ClientId.Value, cancellationToken);
            if (clientUserId.HasValue)
                await _dispatcher.AdminApprovedAsync(clientUserId.Value,
                    "Nutrition Plan Approved",
                    $"Your nutrition plan '{plan.Title}' has been approved.", cancellationToken);
        }

        return Result.Success();
    }
}

internal sealed class RejectNutritionPlanCommandHandler : ICommandHandler<RejectNutritionPlanCommand>
{
    private readonly INutritionPlanRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public RejectNutritionPlanCommandHandler(INutritionPlanRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(RejectNutritionPlanCommand command, CancellationToken cancellationToken = default)
    {
        var plan = await _repo.GetByIdAsync(command.PlanId, cancellationToken);
        if (plan is null) return Result.Failure(NutritionPlanErrors.NotFound);

        var result = plan.Reject(command.Reason);
        if (result.IsFailure) return result;

        _repo.Update(plan);

        if (plan.ClientId.HasValue)
        {
            var clientUserId = await _dispatcher.GetClientUserIdAsync(plan.ClientId.Value, cancellationToken);
            if (clientUserId.HasValue)
                await _dispatcher.AdminRejectedAsync(clientUserId.Value,
                    "Nutrition Plan Rejected",
                    $"Your nutrition plan '{plan.Title}' was rejected. Reason: {command.Reason}", cancellationToken);
        }

        return Result.Success();
    }
}
