namespace NP.Application.Abstractions.Authentication;

public interface IUserContext
{
    Guid UserId { get; }
    string Role { get; }
}
