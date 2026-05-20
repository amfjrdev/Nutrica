namespace NP.Domain.Abstractions;

public interface IRepository<T> where T : Entity
{
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);


}

//readonly repo