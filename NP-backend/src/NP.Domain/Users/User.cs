using NP.Domain.Abstractions;

namespace NP.Domain.Users;

public sealed class User : Entity
{
    private User() { }

    private User(Guid id, string email, string firstName, string lastName, string? phoneNumber)
        : base(id)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        PhoneNumber = phoneNumber;
        CreatedAt = DateTime.UtcNow;
    }

    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public bool IsSuspended { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // ── OTP fields ────────────────────────────────────────────────────────────
    public string? OtpHash { get; private set; }
    public DateTime? OtpExpiry { get; private set; }
    public int OtpAttempts { get; private set; }
    public DateTime? OtpLastSentAt { get; private set; }

    public static Result<User> Create(string email, string firstName, string lastName, string? phoneNumber = null)
    {
        if (string.IsNullOrWhiteSpace(email))
            return Result.Failure<User>(UserErrors.InvalidEmail);

        if (string.IsNullOrWhiteSpace(firstName))
            return Result.Failure<User>(UserErrors.InvalidFirstName);

        if (string.IsNullOrWhiteSpace(lastName))
            return Result.Failure<User>(UserErrors.InvalidLastName);

        var user = new User(Guid.NewGuid(), email.ToLowerInvariant().Trim(), firstName.Trim(), lastName.Trim(), phoneNumber?.Trim());
        return Result.Success(user);
    }

    public void SetPasswordHash(string hash)
    {
        PasswordHash = hash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRole(string role)
    {
        Role = role;
        UpdatedAt = DateTime.UtcNow;
    }

    // Stores a hashed OTP with a 5-minute expiry and resets the attempt counter.
    public void SetOtp(string otpHash, DateTime expiry)
    {
        OtpHash = otpHash;
        OtpExpiry = expiry;
        OtpAttempts = 0;
        OtpLastSentAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    // Increments the failed attempt counter.
    public void IncrementOtpAttempts()
    {
        OtpAttempts++;
        UpdatedAt = DateTime.UtcNow;
    }

    // Clears all OTP fields after successful verification.
    public void ClearOtp()
    {
        OtpHash = null;
        OtpExpiry = null;
        OtpAttempts = 0;
        OtpLastSentAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public Result Suspend()
    {
        if (IsSuspended) return Result.Failure(UserErrors.AlreadySuspended);
        IsSuspended = true;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Activate()
    {
        if (!IsSuspended) return Result.Failure(UserErrors.NotSuspended);
        IsSuspended = false;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
