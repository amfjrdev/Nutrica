using Microsoft.EntityFrameworkCore;
using NP.Domain.Chat;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class ChatMessageRepository : IChatMessageRepository
{
    private readonly ApplicationDbContext _db;

    public ChatMessageRepository(ApplicationDbContext db) => _db = db;

    public async Task AddAsync(ChatMessage message, CancellationToken ct = default)
    {
        await _db.ChatMessages.AddAsync(message, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<ChatMessage>> GetByAppointmentAsync(
        Guid appointmentId, CancellationToken ct = default)
    {
        var rows = await _db.ChatMessages
            .Where(m => m.AppointmentId == appointmentId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

        foreach (var row in rows)
            row.MarkUtc();

        return rows;
    }

    public async Task<Dictionary<Guid, ChatMessage>> GetLastMessagePerRoomAsync(
        IEnumerable<Guid> roomIds, CancellationToken ct = default)
    {
        var ids = roomIds.ToList();
        if (ids.Count == 0) return new Dictionary<Guid, ChatMessage>();

        // Get the max SentAt per room, then join back to get the full row.
        // Avoids GroupBy+First which SQL Server EF Core can't translate.
        var latestTimes = await _db.ChatMessages
            .Where(m => ids.Contains(m.AppointmentId))
            .GroupBy(m => m.AppointmentId)
            .Select(g => new { RoomId = g.Key, MaxSentAt = g.Max(m => m.SentAt) })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, ChatMessage>();
        foreach (var lt in latestTimes)
        {
            var msg = await _db.ChatMessages
                .Where(m => m.AppointmentId == lt.RoomId && m.SentAt == lt.MaxSentAt)
                .FirstOrDefaultAsync(ct);
            if (msg is null) continue;
            msg.MarkUtc();
            result[lt.RoomId] = msg;
        }

        return result;
    }
}
