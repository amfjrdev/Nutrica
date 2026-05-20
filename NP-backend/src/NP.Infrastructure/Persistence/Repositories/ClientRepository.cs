using Microsoft.EntityFrameworkCore;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class ClientRepository : Repository<Client>, IClientRepository
{
    public ClientRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Client?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await Context.Clients.FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

    public async Task<List<Client>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Clients.ToListAsync(cancellationToken);
}
