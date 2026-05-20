using NP.Domain.Abstractions;

namespace NP.Domain.Clients;

public static class ClientErrors
{
    public static readonly Error InvalidUserId = new("Client.InvalidUserId", "User ID is invalid.");
    public static readonly Error NotFound = new("Client.NotFound", "Client not found.");
    public static readonly Error InvalidGoal = new("Client.InvalidGoal", "Goal is required.");
}
