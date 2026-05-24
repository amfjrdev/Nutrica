using Microsoft.EntityFrameworkCore;
using NP.Domain.CalorieScans;
using NP.Domain.CalorieScans.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class CalorieScanRepository : Repository<CalorieScan>, ICalorieScanRepository
{
    public CalorieScanRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<CalorieScan>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default) =>
        await Context.Set<CalorieScan>()
            .Where(s => s.ClientId == clientId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
}
