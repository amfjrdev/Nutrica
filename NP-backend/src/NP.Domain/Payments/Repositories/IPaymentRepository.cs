using NP.Domain.Abstractions;

namespace NP.Domain.Payments.Repositories;

public interface IPaymentRepository : IRepository<Payment>
{
    Task<List<Payment>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<List<Payment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Payment?> GetByStripePaymentIntentIdAsync(string stripePaymentIntentId, CancellationToken cancellationToken = default);
}
