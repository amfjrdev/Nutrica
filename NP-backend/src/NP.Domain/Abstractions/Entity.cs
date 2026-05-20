namespace NP.Domain.Abstractions;

public abstract class Entity
{
    protected Entity() { }
    public Guid Id { get; init; }
    protected Entity(Guid id) => Id = id;
}
