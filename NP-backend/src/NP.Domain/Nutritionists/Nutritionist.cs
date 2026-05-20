using NP.Domain.Abstractions;

namespace NP.Domain.Nutritionists;

public sealed class Nutritionist : Entity
{
    private Nutritionist() { }

    private Nutritionist(Guid id, Guid userId) : base(id)
    {
        UserId = userId;
        IsApproved = false;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }
    public string? Bio { get; private set; }
    public string? Specialization { get; private set; }
    public string? CertificateUrl { get; private set; }
    public bool IsApproved { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public static Result<Nutritionist> Create(Guid userId)
    {
        if (userId == Guid.Empty)
            return Result.Failure<Nutritionist>(NutritionistErrors.InvalidUserId);

        return Result.Success(new Nutritionist(Guid.NewGuid(), userId));
    }

    public Result UpdateProfile(string bio, string specialization, string? certificateUrl)
    {
        if (string.IsNullOrWhiteSpace(bio))
            return Result.Failure(NutritionistErrors.InvalidBio);

        Bio = bio;
        Specialization = specialization;
        CertificateUrl = certificateUrl;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Approve()
    {
        if (IsApproved) return Result.Failure(NutritionistErrors.AlreadyApproved);
        IsApproved = true;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
