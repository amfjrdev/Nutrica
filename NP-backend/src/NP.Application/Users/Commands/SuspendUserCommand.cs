using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Users.Commands;

public sealed record SuspendUserCommand(Guid UserId) : ICommand;

internal sealed class SuspendUserCommandHandler : ICommandHandler<SuspendUserCommand>
{
    private readonly IUserRepository _userRepository;

    public SuspendUserCommandHandler(IUserRepository userRepository) => _userRepository = userRepository;

    public async Task<Result> HandleAsync(SuspendUserCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null) return Result.Failure(UserErrors.NotFound);

        var result = user.Suspend();
        if (result.IsFailure) return result;

        _userRepository.Update(user);
        return Result.Success();
    }
}
