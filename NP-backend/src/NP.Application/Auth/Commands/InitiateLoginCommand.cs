using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Email;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Auth.Commands;

// Step 1 of 2FA: validate credentials → send OTP → return pending indicator (no JWT)
public sealed record InitiateLoginCommand(string Email, string Password) : ICommand<OtpPendingResult>;

// Returned to the client after step 1.
// In Development, OtpCode is populated so you can test without a real email.
// In Production, OtpCode is always null.
public sealed record OtpPendingResult(string Email, string Message, string? OtpCode = null);

internal sealed class InitiateLoginCommandHandler : ICommandHandler<InitiateLoginCommand, OtpPendingResult>
{
    private const int OtpExpiryMinutes = 5;

    private readonly IUserRepository  _userRepository;
    private readonly IPasswordHasher  _passwordHasher;
    private readonly IOtpService      _otpService;
    private readonly IEmailService    _emailService;
    private readonly IHostEnvironment _env;
    private readonly ILogger<InitiateLoginCommandHandler> _logger;

    public InitiateLoginCommandHandler(
        IUserRepository  userRepository,
        IPasswordHasher  passwordHasher,
        IOtpService      otpService,
        IEmailService    emailService,
        IHostEnvironment env,
        ILogger<InitiateLoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _otpService     = otpService;
        _emailService   = emailService;
        _env            = env;
        _logger         = logger;
    }

    public async Task<Result<OtpPendingResult>> HandleAsync(
        InitiateLoginCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(
            command.Email.ToLowerInvariant(), cancellationToken);

        // Same error for "not found" and "wrong password" — prevents user enumeration.
        if (user is null || !_passwordHasher.Verify(command.Password, user.PasswordHash))
            return Result.Failure<OtpPendingResult>(UserErrors.InvalidCredentials);

        if (user.IsSuspended)
            return Result.Failure<OtpPendingResult>(new Error("Auth.Suspended", "Your account has been suspended."));

        if (!user.IsActive)
            return Result.Failure<OtpPendingResult>(new Error("Auth.Inactive", "Your account is inactive."));

        var otp    = _otpService.Generate();
        var hash   = _otpService.Hash(otp);
        var expiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);

        user.SetOtp(hash, expiry);
        _userRepository.Update(user);

        // In Development: return OTP in response so the system works without email config.
        // In Production: OTP is never exposed — only sent via email.
        var isDev = _env.IsDevelopment();

        try
        {
            await _emailService.SendOtpAsync(user.Email, user.FirstName, otp, cancellationToken);
            _logger.LogInformation("OTP email sent for user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email for user {UserId}", user.Id);

            // In Production: fail hard so the user knows email didn't arrive.
            // In Development: continue and expose OTP in response for easy testing.
            if (!isDev)
                return Result.Failure<OtpPendingResult>(
                    new Error("Auth.EmailFailed", "Failed to send verification email. Please try again."));
        }

        var message = isDev
            ? "[DEV MODE] OTP is included in this response. Remove in production."
            : "A 6-digit verification code has been sent to your email. It expires in 5 minutes.";

        return Result.Success(new OtpPendingResult(
            user.Email,
            message,
            isDev ? otp : null));   // ← OTP only visible in Development
    }
}
