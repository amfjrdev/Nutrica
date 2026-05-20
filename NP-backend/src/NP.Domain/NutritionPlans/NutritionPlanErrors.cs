using NP.Domain.Abstractions;

namespace NP.Domain.NutritionPlans;

public static class NutritionPlanErrors
{
    public static readonly Error InvalidNutritionistId = new("NutritionPlan.InvalidNutritionistId", "Nutritionist ID is invalid.");
    public static readonly Error InvalidTitle = new("NutritionPlan.InvalidTitle", "Title is required.");
    public static readonly Error InvalidContent = new("NutritionPlan.InvalidContent", "Content is required.");
    public static readonly Error NotFound = new("NutritionPlan.NotFound", "Nutrition plan not found.");
    public static readonly Error InvalidStatusTransition = new("NutritionPlan.InvalidStatusTransition", "This status transition is not allowed.");
    public static readonly Error CannotEditApproved = new("NutritionPlan.CannotEditApproved", "An approved plan cannot be edited.");
}
