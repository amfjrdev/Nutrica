namespace NP.Domain.Chat;

/// <summary>
/// A persisted chat message scoped to one appointment session.
/// Messages are never deleted automatically — the full history is always available.
/// </summary>
public sealed class ChatMessage
{
    // Private constructor — use the factory method below.
    private ChatMessage() { }

    public Guid     Id            { get; private set; }
    public Guid     AppointmentId { get; private set; }

    /// <summary>JWT sub claim — the sender's user GUID as a string.</summary>
    public string   SenderUserId  { get; private set; } = string.Empty;

    /// <summary>"Client" or "Nutritionist" — taken directly from the JWT role claim.</summary>
    public string   SenderRole    { get; private set; } = string.Empty;

    public string   Message       { get; private set; } = string.Empty;

    /// <summary>Always stored and returned as UTC with Kind=Utc.</summary>
    public DateTime SentAt        { get; private set; }

    /// <summary>
    /// Factory method — the only way to create a valid ChatMessage.
    /// SentAt is set here so the persisted value and the broadcast value
    /// are always identical (single source of truth).
    /// </summary>
    public static ChatMessage Create(
        Guid   appointmentId,
        string senderUserId,
        string senderRole,
        string message) => new()
    {
        Id            = Guid.NewGuid(),
        AppointmentId = appointmentId,
        SenderUserId  = senderUserId,
        SenderRole    = senderRole,
        Message       = message,
        // SpecifyKind ensures System.Text.Json serializes with the 'Z' suffix.
        // Without this, EF Core returns Kind=Unspecified from SQL Server and
        // the frontend parses timestamps as local time instead of UTC.
        SentAt        = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
    };

    /// <summary>
    /// Called by the repository after EF Core materializes rows from SQL Server.
    /// EF Core returns DateTime with Kind=Unspecified; this re-tags it as Utc
    /// so the JSON serializer emits the 'Z' suffix correctly.
    /// </summary>
    public void MarkUtc() =>
        SentAt = DateTime.SpecifyKind(SentAt, DateTimeKind.Utc);
}
