using NP.Domain.Abstractions;

namespace NP.Domain.Admins.Repositories;

public interface IAdminRepository : IRepository<Admin>
{
    Task<Admin?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
