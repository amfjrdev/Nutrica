using NP.Domain.Users;

namespace NP.Application.Abstractions.Authentication;

public interface IJwtService
{
    string GenerateToken(User user, string role);
}
