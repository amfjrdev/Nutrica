using NP.Domain.Abstractions;

namespace NP.Domain.Feedbacks;

public static class FeedbackErrors
{
    public static readonly Error InvalidClientId = new("Feedback.InvalidClientId", "Client ID is invalid.");
    public static readonly Error InvalidPlanId = new("Feedback.InvalidPlanId", "Nutrition plan ID is invalid.");
    public static readonly Error InvalidRating = new("Feedback.InvalidRating", "Rating must be between 1 and 5.");
    public static readonly Error NotFound = new("Feedback.NotFound", "Feedback not found.");
}
