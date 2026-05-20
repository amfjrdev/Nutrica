using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NP.Domain.Chat;
using NP.Domain.Clients.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.API.Hubs;

/// <summary>
/// Real-time chat hub — WebSocket transport only.
///
/// Client → Server calls:
///   JoinSession(appointmentId)          join room + receive full message history
///   SendMessage(appointmentId, message) persist + broadcast to room
///   LeaveSession(appointmentId)         leave room
///
/// Server → Client events:
///   MessageHistory(message[])           full history, sent only to the joining caller
///   ReceiveMessage(senderUserId, senderRole, message, sentAt)
///   UserJoined(userId, joinedAt)
///   UserLeft(userId, leftAt)
///   Error(text)
/// </summary>
[Authorize]
public sealed class ChatHub : Hub
{
    private readonly IChatMessageRepository _repo;
    private readonly IClientRepository _clientRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;

    public ChatHub(
        IChatMessageRepository repo,
        IClientRepository clientRepository,
        ISubscriptionRepository subscriptionRepository)
    {
        _repo = repo;
        _clientRepository = clientRepository;
        _subscriptionRepository = subscriptionRepository;
    }

    // SignalR group name for a given appointment room.
    private static string Room(string appointmentId) => $"chat:{appointmentId}";

    /// <summary>
    /// Returns true only if the caller is a Client with an active Personalized subscription,
    /// OR is a Nutritionist (they can always join their client's room).
    /// </summary>
    private async Task<bool> HasChatAccessAsync()
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        if (role.Equals("Nutritionist", StringComparison.OrdinalIgnoreCase)) return true;
        if (!role.Equals("Client", StringComparison.OrdinalIgnoreCase)) return false;

        var userIdStr = GetUserId();
        if (!Guid.TryParse(userIdStr, out var userId)) return false;

        var client = await _clientRepository.GetByUserIdAsync(userId);
        if (client is null) return false;

        var sub = await _subscriptionRepository.GetActiveByClientIdAsync(client.Id);
        return sub is not null && sub.Type == SubscriptionType.Personalized;
    }

    /// <summary>
    /// Resolves the caller's user ID from the JWT.
    /// JwtService emits JwtRegisteredClaimNames.Sub; ASP.NET Core maps that to
    /// ClaimTypes.NameIdentifier when NameClaimType is configured, which makes
    /// Context.UserIdentifier the primary source. The fallbacks handle edge cases.
    /// </summary>
    private string GetUserId() =>
        Context.UserIdentifier
        ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Context.User?.FindFirstValue("sub")
        ?? throw new HubException("Cannot resolve user ID from token.");

    private string GetRole() =>
        Context.User?.FindFirstValue(ClaimTypes.Role)
        ?? throw new HubException("Cannot resolve role from token.");

    // -------------------------------------------------------------------------
    // JoinSession
    // -------------------------------------------------------------------------

    public async Task JoinSession(string appointmentId)
    {
        if (string.IsNullOrWhiteSpace(appointmentId))
        {
            await Clients.Caller.SendAsync("Error", "appointmentId is required.");
            return;
        }

        if (!await HasChatAccessAsync())
        {
            await Clients.Caller.SendAsync("Error", "Chat requires an active Personalized subscription.");
            return;
        }

        // Add this connection to the SignalR group for the appointment room.
        await Groups.AddToGroupAsync(Context.ConnectionId, Room(appointmentId));

        // Load and send the full message history only to the joining user.
        if (Guid.TryParse(appointmentId, out var apptGuid))
        {
            var history = await _repo.GetByAppointmentAsync(apptGuid);

            var payload = history.Select(m => new
            {
                senderUserId = m.SenderUserId,
                senderRole   = m.SenderRole.ToLowerInvariant(),
                message      = m.Message,
                sentAt       = m.SentAt,   // Kind=Utc → serialized with 'Z'
            }).ToList();

            await Clients.Caller.SendAsync("MessageHistory", payload);
        }

        // Notify everyone in the room (including the caller) that a user joined.
        await Clients.Group(Room(appointmentId))
            .SendAsync("UserJoined", GetUserId(), DateTime.UtcNow);
    }

    // -------------------------------------------------------------------------
    // SendMessage
    // -------------------------------------------------------------------------

    public async Task SendMessage(string appointmentId, string message)
    {
        if (string.IsNullOrWhiteSpace(appointmentId))
        {
            await Clients.Caller.SendAsync("Error", "appointmentId is required.");
            return;
        }

        if (!await HasChatAccessAsync())
        {
            await Clients.Caller.SendAsync("Error", "Chat requires an active Personalized subscription.");
            return;
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            await Clients.Caller.SendAsync("Error", "Message cannot be empty.");
            return;
        }

        if (!Guid.TryParse(appointmentId, out var apptGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid appointmentId format.");
            return;
        }

        var senderUserId = GetUserId();
        var senderRole   = GetRole();

        // Persist first — ChatMessage.Create sets SentAt with Kind=Utc.
        // Using the entity's SentAt for the broadcast guarantees the persisted
        // timestamp and the broadcasted timestamp are always identical.
        var chatMessage = ChatMessage.Create(apptGuid, senderUserId, senderRole, message);
        await _repo.AddAsync(chatMessage);

        // Broadcast to every connection in the room, including the sender.
        await Clients.Group(Room(appointmentId)).SendAsync(
            "ReceiveMessage",
            senderUserId,
            senderRole.ToLowerInvariant(),   // always lowercase: "client" | "nutritionist"
            message,
            chatMessage.SentAt);
    }

    // -------------------------------------------------------------------------
    // LeaveSession
    // -------------------------------------------------------------------------

    public async Task LeaveSession(string appointmentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, Room(appointmentId));

        await Clients.Group(Room(appointmentId))
            .SendAsync("UserLeft", GetUserId(), DateTime.UtcNow);
    }

    // -------------------------------------------------------------------------
    // Disconnect
    // -------------------------------------------------------------------------

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // SignalR automatically removes the connection from all groups on disconnect.
        // We log unexpected disconnects but never expose internal details to clients.
        if (exception is not null)
            Console.Error.WriteLine(
                $"[ChatHub] {Context.ConnectionId} disconnected: {exception.GetType().Name}");

        await base.OnDisconnectedAsync(exception);
    }
}
