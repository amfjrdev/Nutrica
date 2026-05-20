using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Users.Repositories;

namespace NP.Application.Users.Queries;

public sealed record UserDto(Guid Id, string Email, string FirstName, string LastName, string Role, bool IsActive, bool IsSuspended, DateTime CreatedAt);

public sealed record GetAllUsersQuery : IQuery<List<UserDto>>;

internal sealed class GetAllUsersQueryHandler : IQueryHandler<GetAllUsersQuery, List<UserDto>>
{
    private readonly IUserRepository _userRepository;

    public GetAllUsersQueryHandler(IUserRepository userRepository) => _userRepository = userRepository;

    public async Task<Result<List<UserDto>>> HandleAsync(GetAllUsersQuery query, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var dtos = users.Select(u => new UserDto(u.Id, u.Email, u.FirstName, u.LastName, u.Role, u.IsActive, u.IsSuspended, u.CreatedAt)).ToList();
        return Result.Success(dtos);
    }
}
