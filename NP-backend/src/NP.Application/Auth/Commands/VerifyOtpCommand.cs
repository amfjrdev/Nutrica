using Microsoft.Extensions.Logging;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Auth.Commands;

// Step 2 of 2FA: verify OTP → issue JWT
public sealed record VerifyOtpCommand(string Email, string Otp) : ICommand<AuthResult>;

internal sealed class VerifyOtpCommandHandler : ICommandHandler<VerifyOtpCommand, AuthResult>
{
    private const int MaxAttempts = 3;

    private readonly IUserRepository _userRepository;
    private readonly IOtpService     _otpService;
    private readonly IJwtService     _jwtService;
    private readonly ILogger<VerifyOtpCommandHandler> _logger;

    public VerifyOtpCommandHandler(
        IUserRepository userRepository,
        IOtpService     otpService,
        IJwtService     jwtService,
        ILogger<VerifyOtpCommandHandler> logger)
    {
        _userRepository = userRepository;
        _otpService     = otpService;
        _jwtService     = jwtService;
        _logger         = logger;
    }

    public async Task<Result<AuthResult>> HandleAsync(
        VerifyOtpCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(
            command.Email.ToLowerInvariant(), cancellationToken);

        if (user is null)
            return Result.Failure<AuthResult>(UserErrors.InvalidCredentials);

        // Guard: OTP must have been issued
        if (user.OtpHash is null || user.OtpExpiry is null)
            return Result.Failure<AuthResult>(UserErrors.OtpNotPending);

        // Guard: max attempts
        if (user.OtpAttempts >= MaxAttempts)
        {
            _logger.LogWarning("OTP max attempts reached for user {UserId}", user.Id);
            return Result.Failure<AuthResult>(UserErrors.OtpMaxAttempts);
        }

        // Guard: expiry
        if (DateTime.UtcNow > user.OtpExpiry.Value)
        {
            _logger.LogInformation("OTP expired for user {UserId}", user.Id);
            return Result.Failure<AuthResult>(UserErrors.OtpExpired);
        }

        // Guard: correctness
        if (!_otpService.Verify(command.Otp, user.OtpHash))
        {
            user.IncrementOtpAttempts();
            _userRepository.Update(user);

            var remaining = MaxAttempts - user.OtpAttempts;
            _logger.LogWarning("Invalid OTP for user {UserId}. Attempts remaining: {Remaining}", user.Id, remaining);

            return Result.Failure<AuthResult>(remaining > 0
                ? new Error("Auth.OtpInvalid", $"Incorrect code. {remaining} attempt{(remaining == 1 ? "" : "s")} remaining.")
                : UserErrors.OtpMaxAttempts);
        }

        // Success — clear OTP fields and issue JWT
        user.ClearOtp();
        _userRepository.Update(user);

        _logger.LogInformation("User {UserId} authenticated successfully via OTP", user.Id);

        var token = _jwtService.GenerateToken(user, user.Role);
        return Result.Success(new AuthResult(
            user.Id, user.Email, user.FirstName, user.LastName, user.Role, token));
    }
}
