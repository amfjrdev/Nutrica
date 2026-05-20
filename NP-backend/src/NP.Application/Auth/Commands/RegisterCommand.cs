using NP.Application.Abstractions.Messaging;

namespace NP.Application.Auth.Commands;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string Role
) : ICommand<AuthResult>;

public sealed record AuthResult(Guid UserId, string Email, string FirstName, string LastName, string Role, string Token);
