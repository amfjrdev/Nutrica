using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;

namespace NP.Application.Appointments.Queries;

public sealed record AvailableSlotDto(DateTime SlotUtc);

public sealed record GetAvailableSlotsQuery(Guid NutritionistId) : IQuery<List<AvailableSlotDto>>;

internal sealed class GetAvailableSlotsQueryHandler : IQueryHandler<GetAvailableSlotsQuery, List<AvailableSlotDto>>
{
    private const int DaysAhead   = 14;
    private const int SlotMinutes = 60; // hourly — change to 30 for half-hour slots

    private readonly IAppointmentRepository _repo;

    public GetAvailableSlotsQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AvailableSlotDto>>> HandleAsync(
        GetAvailableSlotsQuery query, CancellationToken cancellationToken = default)
    {
        var now   = DateTime.UtcNow;
        // First available slot = next full UTC hour
        var start = new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, DateTimeKind.Utc)
                        .AddHours(1);
        // Exclusive upper bound — midnight UTC at end of window
        var end   = DateTime.SpecifyKind(now.Date.AddDays(DaysAhead + 1), DateTimeKind.Utc);

        // ── DateTime.Kind fix ────────────────────────────────────────────────
        // EF Core reads SQL Server datetime2 columns as DateTimeKind.Unspecified.
        // Generated slots above are DateTimeKind.Utc.
        // DateTime equality in .NET includes Kind, so a HashSet<DateTime> built
        // from Unspecified values will NEVER match Utc values — taken slots are
        // never subtracted and every slot appears as available.
        //
        // Fix: normalise every ScheduledAt to Utc via SpecifyKind before adding
        // to the HashSet. This is safe because all datetimes in this system are
        // stored and interpreted as UTC.
        // ─────────────────────────────────────────────────────────────────────
        var booked = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        var takenSet = booked
            .Where(a => a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Approved)
            .Select(a => DateTime.SpecifyKind(a.ScheduledAt, DateTimeKind.Utc))
            .ToHashSet();

        var slots = new List<AvailableSlotDto>();
        for (var slot = start; slot < end; slot = slot.AddMinutes(SlotMinutes))
        {
            if (!takenSet.Contains(slot))
                slots.Add(new AvailableSlotDto(slot));
        }

        return Result.Success(slots);
    }
}
