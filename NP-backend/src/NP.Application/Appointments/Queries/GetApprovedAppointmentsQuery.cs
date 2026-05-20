using NP.Application.Abstractions.Messaging;
using NP.Application.Appointments.Queries;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;

namespace NP.Application.Appointments.Queries;

public sealed record GetApprovedAppointmentsQuery(Guid NutritionistId) : IQuery<List<AppointmentDto>>;

internal sealed class GetApprovedAppointmentsQueryHandler : IQueryHandler<GetApprovedAppointmentsQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetApprovedAppointmentsQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AppointmentDto>>> HandleAsync(GetApprovedAppointmentsQuery query, CancellationToken cancellationToken = default)
    {
        var all = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);
        var approved = all.Where(a => a.Status == AppointmentStatus.Approved).Select(AppointmentMapper.ToDto).ToList();
        return Result.Success(approved);
    }
}
