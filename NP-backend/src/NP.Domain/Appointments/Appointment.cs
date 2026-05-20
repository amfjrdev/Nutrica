using NP.Domain.Abstractions;

namespace NP.Domain.Appointments;

public sealed class Appointment : Entity
{
    private Appointment() { }

    private Appointment(Guid id, Guid clientId, Guid nutritionistId, DateTime scheduledAt, string? notes)
        : base(id)
    {
        ClientId = clientId;
        NutritionistId = nutritionistId;
        ScheduledAt = scheduledAt;
        Notes = notes;
        Status = AppointmentStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid ClientId { get; private set; }
    public Guid NutritionistId { get; private set; }
    public DateTime ScheduledAt { get; private set; }
    public string? Notes { get; private set; }
    public string? RejectionReason { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public static Result<Appointment> Create(Guid clientId, Guid nutritionistId, DateTime scheduledAt, string? notes = null)
    {
        if (clientId == Guid.Empty) return Result.Failure<Appointment>(AppointmentErrors.InvalidClientId);
        if (nutritionistId == Guid.Empty) return Result.Failure<Appointment>(AppointmentErrors.InvalidNutritionistId);
        if (scheduledAt <= DateTime.UtcNow) return Result.Failure<Appointment>(AppointmentErrors.InvalidScheduledAt);

        return Result.Success(new Appointment(Guid.NewGuid(), clientId, nutritionistId, scheduledAt, notes));
    }

    public Result Approve()
    {
        if (Status != AppointmentStatus.Pending) return Result.Failure(AppointmentErrors.InvalidStatusTransition);
        Status = AppointmentStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject(string reason)
    {
        if (Status != AppointmentStatus.Pending) return Result.Failure(AppointmentErrors.InvalidStatusTransition);
        Status = AppointmentStatus.Rejected;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status is AppointmentStatus.Attended or AppointmentStatus.Rejected)
            return Result.Failure(AppointmentErrors.InvalidStatusTransition);
        Status = AppointmentStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Attend()
    {
        if (Status != AppointmentStatus.Approved) return Result.Failure(AppointmentErrors.InvalidStatusTransition);
        Status = AppointmentStatus.Attended;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
