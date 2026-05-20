using NP.Domain.Abstractions;

namespace NP.Domain.Clients;

public sealed class Client : Entity
{
    private Client() { }

    private Client(Guid id, Guid userId) : base(id)
    {
        UserId = userId;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }
    public string? Goal { get; private set; }
    public string? MedicalConditions { get; private set; }
    public string? FoodAllergies { get; private set; }
    public string? ActivityLevel { get; private set; }
    public decimal? Weight { get; private set; }
    public decimal? Height { get; private set; }
    public int? Age { get; private set; }
    public string? Gender { get; private set; }
    public bool QuestionnaireCompleted { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public static Result<Client> Create(Guid userId)
    {
        if (userId == Guid.Empty)
            return Result.Failure<Client>(ClientErrors.InvalidUserId);

        return Result.Success(new Client(Guid.NewGuid(), userId));
    }

    public Result FillQuestionnaire(string goal, string? medicalConditions, string? foodAllergies,
        string activityLevel, decimal weight, decimal height, int age, string gender)
    {
        if (string.IsNullOrWhiteSpace(goal))
            return Result.Failure(ClientErrors.InvalidGoal);

        Goal = goal;
        MedicalConditions = medicalConditions;
        FoodAllergies = foodAllergies;
        ActivityLevel = activityLevel;
        Weight = weight;
        Height = height;
        Age = age;
        Gender = gender;
        QuestionnaireCompleted = true;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
