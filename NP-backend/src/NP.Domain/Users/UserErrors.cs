using NP.Domain.Abstractions;

namespace NP.Domain.Users;

public static class UserErrors
{
    public static readonly Error InvalidEmail          = new("User.InvalidEmail",          "Email is invalid.");
    public static readonly Error InvalidFirstName      = new("User.InvalidFirstName",      "First name is invalid.");
    public static readonly Error InvalidLastName       = new("User.InvalidLastName",       "Last name is invalid.");
    public static readonly Error EmailAlreadyExists    = new("User.EmailAlreadyExists",    "A user with this email already exists.");
    public static readonly Error NotFound              = new("User.NotFound",              "User not found.");
    public static readonly Error InvalidCredentials    = new("User.InvalidCredentials",    "Invalid email or password.");
    public static readonly Error AlreadySuspended      = new("User.AlreadySuspended",      "User is already suspended.");
    public static readonly Error NotSuspended          = new("User.NotSuspended",          "User is not suspended.");

    // OTP errors
    public static readonly Error OtpRequired           = new("Auth.OtpRequired",           "A verification code has been sent to your email.");
    public static readonly Error OtpInvalid            = new("Auth.OtpInvalid",            "The verification code is incorrect.");
    public static readonly Error OtpExpired            = new("Auth.OtpExpired",            "The verification code has expired. Please request a new one.");
    public static readonly Error OtpMaxAttempts        = new("Auth.OtpMaxAttempts",        "Too many failed attempts. Please request a new verification code.");
    public static readonly Error OtpResendTooSoon      = new("Auth.OtpResendTooSoon",      "Please wait before requesting a new code.");
    public static readonly Error OtpNotPending         = new("Auth.OtpNotPending",         "No pending verification found. Please log in again.");
}
