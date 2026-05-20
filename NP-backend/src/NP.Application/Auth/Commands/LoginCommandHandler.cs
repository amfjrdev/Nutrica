using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Auth.Commands;

internal sealed class LoginCommandHandler : ICommandHandler<LoginCommand, AuthResult>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResult>> HandleAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(command.Email.ToLowerInvariant(), cancellationToken);

        if (user is null || !_passwordHasher.Verify(command.Password, user.PasswordHash))
            return Result.Failure<AuthResult>(UserErrors.InvalidCredentials);

        if (user.IsSuspended)
            return Result.Failure<AuthResult>(new Error("Auth.Suspended", "Your account has been suspended."));

        if (!user.IsActive)
            return Result.Failure<AuthResult>(new Error("Auth.Inactive", "Your account is inactive."));

        var token = _jwtService.GenerateToken(user, user.Role);
        return Result.Success(new AuthResult(user.Id, user.Email, user.FirstName, user.LastName, user.Role, token));
    }
}
