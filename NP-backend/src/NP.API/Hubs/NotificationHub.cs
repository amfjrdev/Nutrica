using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NP.API.Hubs;

/// <summary>
/// Real-time notification hub.
///
/// On connect: user joins their personal group (user:{userId})
///             and their role group (role:Admin | role:Client | role:Nutritionist).
///
/// Server → Client events:
///   ReceiveNotification(id, title, message, type, senderRole, receiverRole, createdAt, isRead)
/// </summary>
[Authorize]
public sealed class NotificationHub : Hub
{
    public static string UserGroup(string userId) => $"user:{userId}";
    public static string RoleGroup(string role) => $"role:{role}";

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var role = GetRole();

        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
        await Groups.AddToGroupAsync(Context.ConnectionId, RoleGroup(role));

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    private string GetUserId() =>
        Context.UserIdentifier
        ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new HubException("Cannot resolve user ID from token.");

    private string GetRole() =>
        Context.User?.FindFirstValue(ClaimTypes.Role)
        ?? throw new HubException("Cannot resolve role from token.");
}
