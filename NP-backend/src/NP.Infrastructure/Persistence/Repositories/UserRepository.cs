using Microsoft.EntityFrameworkCore;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await Context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await Context.Users.AnyAsync(u => u.Email == email, cancellationToken);

    public async Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Users.ToListAsync(cancellationToken);

    public async Task<List<User>> GetByRoleAsync(string role, CancellationToken cancellationToken = default) =>
        await Context.Users.Where(u => u.Role == role).ToListAsync(cancellationToken);
}
