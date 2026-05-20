using NP.Domain.Abstractions;

namespace NP.Domain.NutritionPlans;

public sealed class NutritionPlan : Entity
{
    private NutritionPlan() { }

    private NutritionPlan(Guid id, Guid nutritionistId, Guid? clientId, string title, string content, bool isPredefined)
        : base(id)
    {
        NutritionistId = nutritionistId;
        ClientId = clientId;
        Title = title;
        Content = content;
        IsPredefined = isPredefined;
        Status = NutritionPlanStatus.PendingApproval;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid NutritionistId { get; private set; }
    public Guid? ClientId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public bool IsPredefined { get; private set; }
    public string? RejectionReason { get; private set; }
    public NutritionPlanStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public static Result<NutritionPlan> Create(Guid nutritionistId, Guid? clientId, string title, string content, bool isPredefined = false)
    {
        if (nutritionistId == Guid.Empty) return Result.Failure<NutritionPlan>(NutritionPlanErrors.InvalidNutritionistId);
        if (string.IsNullOrWhiteSpace(title)) return Result.Failure<NutritionPlan>(NutritionPlanErrors.InvalidTitle);
        if (string.IsNullOrWhiteSpace(content)) return Result.Failure<NutritionPlan>(NutritionPlanErrors.InvalidContent);

        return Result.Success(new NutritionPlan(Guid.NewGuid(), nutritionistId, clientId, title, content, isPredefined));
    }

    public Result Update(string title, string content)
    {
        if (Status == NutritionPlanStatus.Approved) return Result.Failure(NutritionPlanErrors.CannotEditApproved);
        if (string.IsNullOrWhiteSpace(title)) return Result.Failure(NutritionPlanErrors.InvalidTitle);
        if (string.IsNullOrWhiteSpace(content)) return Result.Failure(NutritionPlanErrors.InvalidContent);

        Title = title;
        Content = content;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Approve()
    {
        if (Status != NutritionPlanStatus.PendingApproval) return Result.Failure(NutritionPlanErrors.InvalidStatusTransition);
        Status = NutritionPlanStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject(string reason)
    {
        if (Status != NutritionPlanStatus.PendingApproval) return Result.Failure(NutritionPlanErrors.InvalidStatusTransition);
        Status = NutritionPlanStatus.Rejected;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
