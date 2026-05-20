using NP.Application.Abstractions.Messaging;
using NP.Application.Appointments.Queries;
using NP.Domain.Abstractions;
using NP.Domain.Appointments.Repositories;

namespace NP.Application.Appointments.Queries;

public sealed record GetAllAppointmentsQuery : IQuery<List<AppointmentDto>>;

internal sealed class GetAllAppointmentsQueryHandler : IQueryHandler<GetAllAppointmentsQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _repo;
    public GetAllAppointmentsQueryHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result<List<AppointmentDto>>> HandleAsync(GetAllAppointmentsQuery query, CancellationToken cancellationToken = default)
    {
        var all = await _repo.GetAllAsync(cancellationToken);
        return Result.Success(all.Select(AppointmentMapper.ToDto).ToList());
    }
}
