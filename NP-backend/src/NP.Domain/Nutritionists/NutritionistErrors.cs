using NP.Domain.Abstractions;

namespace NP.Domain.Nutritionists;

public static class NutritionistErrors
{
    public static readonly Error InvalidUserId = new("Nutritionist.InvalidUserId", "User ID is invalid.");
    public static readonly Error NotFound = new("Nutritionist.NotFound", "Nutritionist not found.");
    public static readonly Error InvalidBio = new("Nutritionist.InvalidBio", "Bio is required.");
    public static readonly Error AlreadyApproved = new("Nutritionist.AlreadyApproved", "Nutritionist is already approved.");
}
