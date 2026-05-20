using NP.Domain.Abstractions;

namespace NP.Domain.Clients.Repositories;

public interface IClientRepository : IRepository<Client>
{
    Task<Client?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Client>> GetAllAsync(CancellationToken cancellationToken = default);
}
