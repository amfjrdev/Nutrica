using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Appointments.Commands;

public sealed record RequestAppointmentCommand(Guid ClientId, Guid NutritionistId, DateTime ScheduledAt, string? Notes) : ICommand<Guid>;

public sealed record ApproveAppointmentCommand(Guid AppointmentId) : ICommand;

public sealed record RejectAppointmentCommand(Guid AppointmentId, string Reason) : ICommand;

public sealed record CancelAppointmentCommand(Guid AppointmentId) : ICommand;

public sealed record AttendAppointmentCommand(Guid AppointmentId) : ICommand;

// --- Handlers ---

internal sealed class RequestAppointmentCommandHandler : ICommandHandler<RequestAppointmentCommand, Guid>
{
    private const int MaxPendingPerClient = 3;
    private static readonly TimeSpan PendingExpiry = TimeSpan.FromHours(24);

    private readonly IAppointmentRepository _repo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly NotificationDispatcher _dispatcher;

    public RequestAppointmentCommandHandler(
        IAppointmentRepository repo,
        ISubscriptionRepository subscriptionRepo,
        NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _subscriptionRepo = subscriptionRepo;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(RequestAppointmentCommand command, CancellationToken cancellationToken = default)
    {
        // 1. Premium guard — only active Personalized ($99) subscribers
        var subscription = await _subscriptionRepo.GetActiveByClientIdAsync(command.ClientId, cancellationToken);
        if (subscription is null || subscription.Type != SubscriptionType.Personalized)
            return Result.Failure<Guid>(AppointmentErrors.PremiumRequired);

        // 2. Auto-expire stale pending requests before counting (keeps the limit fair)
        var expiredPending = await _repo.GetExpiredPendingAsync(
            DateTime.UtcNow.Subtract(PendingExpiry), cancellationToken);
        foreach (var expired in expiredPending)
        {
            expired.Cancel();
            _repo.Update(expired);
        }

        // 3. Anti-spam — max 3 active pending requests per client
        var pendingCount = await _repo.CountPendingByClientAsync(command.ClientId, cancellationToken);
        if (pendingCount >= MaxPendingPerClient)
            return Result.Failure<Guid>(AppointmentErrors.TooManyPendingRequests);

        // 4. Double-booking guard
        //
        // ── Concurrency fix ───────────────────────────────────────────────────
        // IsSlotTakenAsync (SELECT) and AddAsync (INSERT) are two separate DB
        // round-trips. Two requests arriving at the same millisecond can both
        // pass this check before either one commits — a TOCTOU race condition.
        //
        // The application-level check below is a fast, user-friendly first
        // line of defence (returns a clean 409 error message). The real
        // guarantee is the filtered unique index defined in
        // AppointmentConfiguration:
        //
        //   IX_Appointments_NutritionistId_ScheduledAt_Active
        //   WHERE Status IN ('Pending','Approved')
        //
        // If two concurrent requests both slip past this check, the database
        // will reject the second INSERT with a unique-constraint violation,
        // which the GlobalExceptionHandlingMiddleware catches and returns as
        // a 409 Conflict — so no double booking is ever persisted.
        // ─────────────────────────────────────────────────────────────────────
        var slotTaken = await _repo.IsSlotTakenAsync(command.NutritionistId, command.ScheduledAt, cancellationToken);
        if (slotTaken) return Result.Failure<Guid>(AppointmentErrors.SlotAlreadyTaken);

        // 5. Create — domain validates scheduledAt > UtcNow (past-time protection)
        var result = Appointment.Create(command.ClientId, command.NutritionistId, command.ScheduledAt, command.Notes);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        var nutritionistUserId = await _dispatcher.GetNutritionistUserIdAsync(command.NutritionistId, cancellationToken);
        await _dispatcher.ClientActedAsync(nutritionistUserId,
            "New Appointment Request",
            "A client has requested a new appointment.", cancellationToken);

        return Result.Success(result.Value.Id);
    }
}

internal sealed class ApproveAppointmentCommandHandler : ICommandHandler<ApproveAppointmentCommand>
{
    private readonly IAppointmentRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public ApproveAppointmentCommandHandler(IAppointmentRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(ApproveAppointmentCommand command, CancellationToken cancellationToken = default)
    {
        var appointment = await _repo.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null) return Result.Failure(AppointmentErrors.NotFound);

        var result = appointment.Approve();
        if (result.IsFailure) return result;

        _repo.Update(appointment);

        var clientUserId = await _dispatcher.GetClientUserIdAsync(appointment.ClientId, cancellationToken);
        if (clientUserId.HasValue)
            await _dispatcher.AdminApprovedAsync(clientUserId.Value,
                "Appointment Approved", "Your appointment has been approved.", cancellationToken);

        return Result.Success();
    }
}

internal sealed class RejectAppointmentCommandHandler : ICommandHandler<RejectAppointmentCommand>
{
    private readonly IAppointmentRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public RejectAppointmentCommandHandler(IAppointmentRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(RejectAppointmentCommand command, CancellationToken cancellationToken = default)
    {
        var appointment = await _repo.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null) return Result.Failure(AppointmentErrors.NotFound);

        var result = appointment.Reject(command.Reason);
        if (result.IsFailure) return result;

        _repo.Update(appointment);

        var clientUserId = await _dispatcher.GetClientUserIdAsync(appointment.ClientId, cancellationToken);
        if (clientUserId.HasValue)
            await _dispatcher.AdminRejectedAsync(clientUserId.Value,
                "Appointment Rejected", $"Your appointment was rejected. Reason: {command.Reason}", cancellationToken);

        return Result.Success();
    }
}

internal sealed class CancelAppointmentCommandHandler : ICommandHandler<CancelAppointmentCommand>
{
    private readonly IAppointmentRepository _repo;
    public CancelAppointmentCommandHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(CancelAppointmentCommand command, CancellationToken cancellationToken = default)
    {
        var appointment = await _repo.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null) return Result.Failure(AppointmentErrors.NotFound);

        var result = appointment.Cancel();
        if (result.IsFailure) return result;

        _repo.Update(appointment);
        return Result.Success();
    }
}

internal sealed class AttendAppointmentCommandHandler : ICommandHandler<AttendAppointmentCommand>
{
    private readonly IAppointmentRepository _repo;
    public AttendAppointmentCommandHandler(IAppointmentRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(AttendAppointmentCommand command, CancellationToken cancellationToken = default)
    {
        var appointment = await _repo.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null) return Result.Failure(AppointmentErrors.NotFound);

        var result = appointment.Attend();
        if (result.IsFailure) return result;

        _repo.Update(appointment);
        return Result.Success();
    }
}
