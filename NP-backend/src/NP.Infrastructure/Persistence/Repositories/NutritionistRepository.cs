using Microsoft.EntityFrameworkCore;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Users;

namespace NP.Infrastructure.Persistence.Repositories;

internal sealed class NutritionistRepository : Repository<Nutritionist>, INutritionistRepository
{
    public NutritionistRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Nutritionist?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await Context.Nutritionists.FirstOrDefaultAsync(n => n.UserId == userId, cancellationToken);

    // Looks up a nutritionist by the email of their associated User record.
    // Used to pin the system to a single known nutritionist without hardcoding a GUID.
    public async Task<Nutritionist?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await Context.Nutritionists
            .Join(Context.Users,
                  n => n.UserId,
                  u => u.Id,
                  (n, u) => new { Nutritionist = n, UserEmail = u.Email })
            .Where(x => x.UserEmail == email.ToLowerInvariant())
            .Select(x => x.Nutritionist)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<List<Nutritionist>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Nutritionists.ToListAsync(cancellationToken);
}
