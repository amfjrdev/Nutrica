using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;

namespace NP.Application.Appointments.Queries;

public sealed record AppointmentDto(Guid Id, Guid ClientId, Guid NutritionistId, DateTime ScheduledAt, string? Notes, string Status, string? RejectionReason, DateTime CreatedAt);

public sealed record GetAppointmentsByClientQuery(Guid ClientId) : IQuery<List<AppointmentDto>>;

public sealed record GetAppointmentsByNutritionistQuery(Guid NutritionistId) : IQuery<List<AppointmentDto>>;

public sealed record GetPendingAppointmentsQuery(Guid NutritionistId) : IQuery<List<AppointmentDto>>;

internal static class AppointmentMapper
{
    public static AppointmentDto ToDto(Appointment a) =>
        // Force DateTimeKind.Utc so JSON serialization always appends 'Z'.
        // EF Core reads DateTime columns as Unspecified; without this the
        // frontend receives "2026-05-01T09:00:00" (no Z) and treats it as
        // local time, breaking slot-key comparisons in the calendar.
        new(a.Id, a.ClientId, a.NutritionistId,
            DateTime.SpecifyKind(a.ScheduledAt, DateTimeKind.Utc),
            a.Notes, a.Status.ToString(), a.RejectionReason,
            DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc));
}

internal sealed class GetAppointmentsByClientQueryHandler : IQueryHandler<GetAppointmentsByClientQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetAppointmentsByClientQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AppointmentDto>>> HandleAsync(GetAppointmentsByClientQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(list.Select(AppointmentMapper.ToDto).ToList());
    }
}

internal sealed class GetAppointmentsByNutritionistQueryHandler : IQueryHandler<GetAppointmentsByNutritionistQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetAppointmentsByNutritionistQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AppointmentDto>>> HandleAsync(GetAppointmentsByNutritionistQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        return Result.Success(list.Select(AppointmentMapper.ToDto).ToList());
    }
}

internal sealed class GetPendingAppointmentsQueryHandler : IQueryHandler<GetPendingAppointmentsQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetPendingAppointmentsQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AppointmentDto>>> HandleAsync(GetPendingAppointmentsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetPendingByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        return Result.Success(list.Select(AppointmentMapper.ToDto).ToList());
    }
}
