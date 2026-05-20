using Microsoft.EntityFrameworkCore;
using NP.Domain.Payments;
using NP.Domain.Payments.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<Payment>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Payments.Where(p => p.ClientId == clientId).ToListAsync(cancellationToken);

    public async Task<List<Payment>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Payments.ToListAsync(cancellationToken);

    public async Task<Payment?> GetByStripePaymentIntentIdAsync(string stripePaymentIntentId, CancellationToken cancellationToken = default) =>
        await Context.Payments.FirstOrDefaultAsync(p => p.StripePaymentIntentId == stripePaymentIntentId, cancellationToken);
}
