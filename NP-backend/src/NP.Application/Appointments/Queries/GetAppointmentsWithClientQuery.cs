using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;
using NP.Domain.Clients.Repositories;
using NP.Domain.Users.Repositories;

namespace NP.Application.Appointments.Queries;

// Enriched DTO used only by the nutritionist dashboard — includes client name.
public sealed record AppointmentWithClientDto(
    Guid     Id,
    Guid     ClientId,
    string   ClientFirstName,
    string   ClientLastName,
    DateTime ScheduledAt,
    string?  Notes,
    string   Status,
    string?  RejectionReason,
    DateTime CreatedAt);

public sealed record GetAppointmentsWithClientQuery(Guid NutritionistId)
    : IQuery<List<AppointmentWithClientDto>>;

internal sealed class GetAppointmentsWithClientQueryHandler
    : IQueryHandler<GetAppointmentsWithClientQuery, List<AppointmentWithClientDto>>
{
    private readonly IAppointmentRepository _repo;
    private readonly IClientRepository      _clientRepo;
    private readonly IUserRepository        _userRepo;

    public GetAppointmentsWithClientQueryHandler(
        IAppointmentRepository repo,
        IClientRepository      clientRepo,
        IUserRepository        userRepo)
    {
        _repo       = repo;
        _clientRepo = clientRepo;
        _userRepo   = userRepo;
    }

    public async Task<Result<List<AppointmentWithClientDto>>> HandleAsync(
        GetAppointmentsWithClientQuery query, CancellationToken cancellationToken = default)
    {
        var appointments = await _repo.GetByNutritionistIdAsync(query.NutritionistId, cancellationToken);

        var result = new List<AppointmentWithClientDto>(appointments.Count);
        foreach (var a in appointments)
        {
            var client = await _clientRepo.GetByIdAsync(a.ClientId, cancellationToken);
            var user   = client is not null
                ? await _userRepo.GetByIdAsync(client.UserId, cancellationToken)
                : null;

            result.Add(new AppointmentWithClientDto(
                a.Id,
                a.ClientId,
                user?.FirstName  ?? "Unknown",
                user?.LastName   ?? "Client",
                // Force UTC so JSON serialization emits a Z suffix
                DateTime.SpecifyKind(a.ScheduledAt, DateTimeKind.Utc),
                a.Notes,
                a.Status.ToString(),
                a.RejectionReason,
                DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc)));
        }

        // Pending first, then by scheduled time ascending
        return Result.Success(result
            .OrderBy(a => a.Status != "Pending")
            .ThenBy(a => a.ScheduledAt)
            .ToList());
    }
}
