using NP.Domain.Abstractions;

namespace NP.Domain.CalorieScans.Repositories;

public interface ICalorieScanRepository : IRepository<CalorieScan>
{
    Task<List<CalorieScan>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
}
