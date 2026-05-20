namespace NP.Domain.Chat;

/// <summary>
/// Persistence contract for chat messages.
/// Implemented in NP.Infrastructure — the domain layer has no EF dependency.
/// </summary>
public interface IChatMessageRepository
{
    Task AddAsync(ChatMessage message, CancellationToken ct = default);

    Task<List<ChatMessage>> GetByAppointmentAsync(Guid appointmentId, CancellationToken ct = default);

    /// <summary>
    /// Returns the most recent message for each of the given room IDs (subscriptionIds).
    /// Used to populate last-message previews in the nutritionist client list.
    /// </summary>
    Task<Dictionary<Guid, ChatMessage>> GetLastMessagePerRoomAsync(IEnumerable<Guid> roomIds, CancellationToken ct = default);
}
