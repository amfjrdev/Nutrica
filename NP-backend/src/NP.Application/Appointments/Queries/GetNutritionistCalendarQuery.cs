using NP.Application.Abstractions.Messaging;
using NP.Application.Appointments.Queries;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;

namespace NP.Application.Appointments.Queries;

public sealed record CalendarSlotDto(DateTime ScheduledAt, string Status);

public sealed record GetNutritionistCalendarQuery(Guid NutritionistId) : IQuery<List<CalendarSlotDto>>;

internal sealed class GetNutritionistCalendarQueryHandler : IQueryHandler<GetNutritionistCalendarQuery, List<CalendarSlotDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetNutritionistCalendarQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<CalendarSlotDto>>> HandleAsync(GetNutritionistCalendarQuery query, CancellationToken cancellationToken = default)
    {
        var appointments = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        var slots = appointments
            .Where(a => a.Status == AppointmentStatus.Approved || a.Status == AppointmentStatus.Pending)
            .Select(a => new CalendarSlotDto(a.ScheduledAt, a.Status.ToString()))
            .OrderBy(s => s.ScheduledAt)
            .ToList();

        return Result.Success(slots);
    }
}
