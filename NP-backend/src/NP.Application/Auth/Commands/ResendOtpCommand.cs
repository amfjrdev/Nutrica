using Microsoft.Extensions.Logging;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Email;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Auth.Commands;

public sealed record ResendOtpCommand(string Email) : ICommand<OtpPendingResult>;

internal sealed class ResendOtpCommandHandler : ICommandHandler<ResendOtpCommand, OtpPendingResult>
{
    private const int OtpExpiryMinutes  = 5;
    private const int ResendCooldownSec = 60;

    private readonly IUserRepository _userRepository;
    private readonly IOtpService     _otpService;
    private readonly IEmailService   _emailService;
    private readonly ILogger<ResendOtpCommandHandler> _logger;

    public ResendOtpCommandHandler(
        IUserRepository userRepository,
        IOtpService     otpService,
        IEmailService   emailService,
        ILogger<ResendOtpCommandHandler> logger)
    {
        _userRepository = userRepository;
        _otpService     = otpService;
        _emailService   = emailService;
        _logger         = logger;
    }

    public async Task<Result<OtpPendingResult>> HandleAsync(
        ResendOtpCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(
            command.Email.ToLowerInvariant(), cancellationToken);

        // Return the same generic error to prevent user enumeration
        if (user is null || user.IsSuspended || !user.IsActive)
            return Result.Failure<OtpPendingResult>(UserErrors.InvalidCredentials);

        // Cooldown: prevent spamming the resend endpoint
        if (user.OtpLastSentAt.HasValue &&
            (DateTime.UtcNow - user.OtpLastSentAt.Value).TotalSeconds < ResendCooldownSec)
        {
            var wait = ResendCooldownSec - (int)(DateTime.UtcNow - user.OtpLastSentAt.Value).TotalSeconds;
            return Result.Failure<OtpPendingResult>(
                new Error("Auth.OtpResendTooSoon", $"Please wait {wait} second{(wait == 1 ? "" : "s")} before requesting a new code."));
        }

        var otp    = _otpService.Generate();
        var hash   = _otpService.Hash(otp);
        var expiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);

        user.SetOtp(hash, expiry);
        _userRepository.Update(user);

        try
        {
            await _emailService.SendOtpAsync(user.Email, user.FirstName, otp, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend OTP email to user {UserId}", user.Id);
            return Result.Failure<OtpPendingResult>(
                new Error("Auth.EmailFailed", "Failed to send verification email. Please try again."));
        }

        _logger.LogInformation("OTP resent to user {UserId}", user.Id);

        return Result.Success(new OtpPendingResult(
            user.Email,
            "A new verification code has been sent to your email."));
    }
}
