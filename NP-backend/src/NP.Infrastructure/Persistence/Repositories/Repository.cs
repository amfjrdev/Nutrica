using Microsoft.EntityFrameworkCore;
using NP.Domain.Abstractions;

namespace NP.Infrastructure.Persistence.Repositories;

internal abstract class Repository<T> : IRepository<T> where T : Entity
{
    protected readonly ApplicationDbContext Context;

    protected Repository(ApplicationDbContext context) => Context = context;

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await Context.Set<T>().AddAsync(entity, cancellationToken);
        await Context.SaveChangesAsync(cancellationToken);
    }

    public void Update(T entity)
    {
        Context.Set<T>().Update(entity);
        Context.SaveChanges();
    }

    public void Remove(T entity)
    {
        Context.Set<T>().Remove(entity);
        Context.SaveChanges();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await Context.Set<T>().FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
}
