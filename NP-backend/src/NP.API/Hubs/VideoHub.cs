using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NP.API.Hubs;

/// <summary>
/// WebRTC signaling hub — WebSocket transport only.
/// The server only relays SDP and ICE messages; media is peer-to-peer.
/// Connect: wss://host/hubs/video?access_token=JWT
///
/// Client → Server methods:
///   JoinSession(appointmentId)                — both peers join the signaling room
///   SendOffer(appointmentId, sdpOffer)        — caller sends SDP offer
///   SendAnswer(appointmentId, sdpAnswer)      — callee sends SDP answer
///   SendIceCandidate(appointmentId, candidate)— both peers exchange ICE candidates
///   EndCall(appointmentId)                    — either peer terminates the call
///
/// Server → Client events:
///   PeerJoined(userId, joinedAt)
///   ReceiveOffer(userId, sdpOffer)
///   ReceiveAnswer(userId, sdpAnswer)
///   ReceiveIceCandidate(userId, candidate)
///   CallEnded(userId, endedAt)
///   Error(message)
/// </summary>
[Authorize]
public sealed class VideoHub : Hub
{
    private static string Room(string appointmentId) => $"video:{appointmentId}";

    public async Task JoinSession(string appointmentId)
    {
        if (string.IsNullOrWhiteSpace(appointmentId))
        {
            await Clients.Caller.SendAsync("Error", "appointmentId is required.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, Room(appointmentId));

        await Clients.OthersInGroup(Room(appointmentId)).SendAsync(
            "PeerJoined",
            Context.UserIdentifier,
            DateTime.UtcNow);
    }

    public async Task SendOffer(string appointmentId, string sdpOffer)
    {
        if (string.IsNullOrWhiteSpace(sdpOffer))
        {
            await Clients.Caller.SendAsync("Error", "SDP offer cannot be empty.");
            return;
        }

        await Clients.OthersInGroup(Room(appointmentId)).SendAsync(
            "ReceiveOffer",
            Context.UserIdentifier,
            sdpOffer);
    }

    public async Task SendAnswer(string appointmentId, string sdpAnswer)
    {
        if (string.IsNullOrWhiteSpace(sdpAnswer))
        {
            await Clients.Caller.SendAsync("Error", "SDP answer cannot be empty.");
            return;
        }

        await Clients.OthersInGroup(Room(appointmentId)).SendAsync(
            "ReceiveAnswer",
            Context.UserIdentifier,
            sdpAnswer);
    }

    public async Task SendIceCandidate(string appointmentId, string candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            await Clients.Caller.SendAsync("Error", "ICE candidate cannot be empty.");
            return;
        }

        await Clients.OthersInGroup(Room(appointmentId)).SendAsync(
            "ReceiveIceCandidate",
            Context.UserIdentifier,
            candidate);
    }

    public async Task EndCall(string appointmentId)
    {
        await Clients.Group(Room(appointmentId)).SendAsync(
            "CallEnded",
            Context.UserIdentifier,
            DateTime.UtcNow);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, Room(appointmentId));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
