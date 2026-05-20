using Microsoft.EntityFrameworkCore;
using NP.Domain.Appointments;
using NP.Domain.Appointments.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<Appointment>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Appointments.ToListAsync(cancellationToken);

    public async Task<List<Appointment>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Appointments
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync(cancellationToken);

    public async Task<List<Appointment>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default) =>
        await Context.Appointments
            .Where(a => a.NutritionistId == nutritionistId)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync(cancellationToken);

    public async Task<List<Appointment>> GetPendingByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default) =>
        await Context.Appointments
            .Where(a => a.NutritionistId == nutritionistId && a.Status == AppointmentStatus.Pending)
            .OrderBy(a => a.ScheduledAt)
            .ToListAsync(cancellationToken);

    // Slot is taken if a Pending or Approved appointment exists at the exact UTC datetime for this nutritionist.
    public async Task<bool> IsSlotTakenAsync(Guid nutritionistId, DateTime scheduledAt, CancellationToken cancellationToken = default) =>
        await Context.Appointments.AnyAsync(
            a => a.NutritionistId == nutritionistId &&
                 a.ScheduledAt == scheduledAt &&
                 (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Approved),
            cancellationToken);

    // Anti-spam: count how many Pending requests this client currently has.
    public async Task<int> CountPendingByClientAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Appointments.CountAsync(
            a => a.ClientId == clientId && a.Status == AppointmentStatus.Pending,
            cancellationToken);

    // Auto-expire: return all Pending appointments created before the expiry threshold.
    public async Task<List<Appointment>> GetExpiredPendingAsync(DateTime expiryThreshold, CancellationToken cancellationToken = default) =>
        await Context.Appointments
            .Where(a => a.Status == AppointmentStatus.Pending && a.CreatedAt < expiryThreshold)
            .ToListAsync(cancellationToken);
}
