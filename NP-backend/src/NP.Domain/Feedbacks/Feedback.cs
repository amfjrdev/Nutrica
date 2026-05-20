using NP.Domain.Abstractions;

namespace NP.Domain.Feedbacks;

public sealed class Feedback : Entity
{
    private Feedback() { }

    private Feedback(Guid id, Guid clientId, Guid nutritionPlanId, string comment, int rating) : base(id)
    {
        ClientId = clientId;
        NutritionPlanId = nutritionPlanId;
        Comment = comment;
        Rating = rating;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid ClientId { get; private set; }
    public Guid NutritionPlanId { get; private set; }
    public string Comment { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Result<Feedback> Create(Guid clientId, Guid nutritionPlanId, string comment, int rating)
    {
        if (clientId == Guid.Empty) return Result.Failure<Feedback>(FeedbackErrors.InvalidClientId);
        if (nutritionPlanId == Guid.Empty) return Result.Failure<Feedback>(FeedbackErrors.InvalidPlanId);
        if (rating < 1 || rating > 5) return Result.Failure<Feedback>(FeedbackErrors.InvalidRating);

        return Result.Success(new Feedback(Guid.NewGuid(), clientId, nutritionPlanId, comment, rating));
    }
}
