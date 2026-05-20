using NP.Domain.Abstractions;

namespace NP.Domain.Admins;

public sealed class Admin : Entity
{
    private Admin() { }

    private Admin(Guid id, Guid userId) : base(id)
    {
        UserId = userId;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Result<Admin> Create(Guid userId)
    {
        if (userId == Guid.Empty)
            return Result.Failure<Admin>(AdminErrors.InvalidUserId);

        return Result.Success(new Admin(Guid.NewGuid(), userId));
    }
}
