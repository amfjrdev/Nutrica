using NP.Application.Abstractions.Messaging;

namespace NP.Application.Auth.Commands;

public sealed record LoginCommand(string Email, string Password) : ICommand<AuthResult>;
