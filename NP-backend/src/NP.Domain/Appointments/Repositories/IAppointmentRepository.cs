using NP.Domain.Abstractions;

namespace NP.Domain.Appointments.Repositories;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<List<Appointment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetPendingByNutritionistIdAsync(Guid nutritionistId, CancellationToken cancellationToken = default);
    Task<bool> IsSlotTakenAsync(Guid nutritionistId, DateTime scheduledAt, CancellationToken cancellationToken = default);
    Task<int> CountPendingByClientAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetExpiredPendingAsync(DateTime expiryThreshold, CancellationToken cancellationToken = default);
}