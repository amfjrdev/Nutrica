using Microsoft.EntityFrameworkCore;
using NP.Domain.Admins;
using NP.Domain.Admins.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class AdminRepository : Repository<Admin>, IAdminRepository
{
    public AdminRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Admin?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await Context.Admins.FirstOrDefaultAsync(a => a.UserId == userId, cancellationToken);
}
