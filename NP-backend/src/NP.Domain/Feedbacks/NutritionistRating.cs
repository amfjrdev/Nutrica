using NP.Domain.Abstractions;

namespace NP.Domain.Feedbacks;

public sealed class NutritionistRating : Entity
{
    private NutritionistRating() { }

    private NutritionistRating(Guid id, Guid clientId, Guid nutritionistId, int rating, string comment) : base(id)
    {
        ClientId       = clientId;
        NutritionistId = nutritionistId;
        Rating         = rating;
        Comment        = comment;
        CreatedAt      = DateTime.UtcNow;
    }

    public Guid   ClientId       { get; private set; }
    public Guid   NutritionistId { get; private set; }
    public int    Rating         { get; private set; }
    public string Comment        { get; private set; } = string.Empty;
    public DateTime CreatedAt    { get; private set; }

    public static Result<NutritionistRating> Create(Guid clientId, Guid nutritionistId, int rating, string comment)
    {
        if (clientId == Guid.Empty)       return Result.Failure<NutritionistRating>(FeedbackErrors.InvalidClientId);
        if (nutritionistId == Guid.Empty) return Result.Failure<NutritionistRating>(new Error("Rating.InvalidNutritionist", "Invalid nutritionist."));
        if (rating < 1 || rating > 5)    return Result.Failure<NutritionistRating>(FeedbackErrors.InvalidRating);

        return Result.Success(new NutritionistRating(Guid.NewGuid(), clientId, nutritionistId, rating, comment));
    }
}
