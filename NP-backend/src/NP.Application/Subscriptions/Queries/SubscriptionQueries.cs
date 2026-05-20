using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Subscriptions.Queries;

public sealed record SubscriptionDto(Guid Id, Guid ClientId, Guid? NutritionistId, Guid? NutritionPlanId, string Type, string Status, DateTime StartsAt, DateTime ExpiresAt);

public sealed record GetActiveSubscriptionQuery(Guid ClientId) : IQuery<SubscriptionDto>;

public sealed record GetAllSubscriptionsQuery : IQuery<List<SubscriptionDto>>;

internal static class SubscriptionMapper
{
    public static SubscriptionDto ToDto(Subscription s) =>
        new(s.Id, s.ClientId, s.NutritionistId, s.NutritionPlanId, s.Type.ToString(), s.Status.ToString(), s.StartsAt, s.ExpiresAt);
}

internal sealed class GetActiveSubscriptionQueryHandler : IQueryHandler<GetActiveSubscriptionQuery, SubscriptionDto>
{
    private readonly ISubscriptionRepository _repo;
    public GetActiveSubscriptionQueryHandler(ISubscriptionRepository repo) => _repo = repo;

    public async Task<Result<SubscriptionDto>> HandleAsync(GetActiveSubscriptionQuery query, CancellationToken cancellationToken = default)
    {
        var sub = await _repo.GetActiveByClientIdAsync(query.ClientId, cancellationToken);
        if (sub is null) return Result.Failure<SubscriptionDto>(SubscriptionErrors.NotFound);
        return Result.Success(SubscriptionMapper.ToDto(sub));
    }
}

internal sealed class GetAllSubscriptionsQueryHandler : IQueryHandler<GetAllSubscriptionsQuery, List<SubscriptionDto>>
{
    private readonly ISubscriptionRepository _repo;
    public GetAllSubscriptionsQueryHandler(ISubscriptionRepository repo) => _repo = repo;

    public async Task<Result<List<SubscriptionDto>>> HandleAsync(GetAllSubscriptionsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetAllAsync(cancellationToken);
        return Result.Success(list.Select(SubscriptionMapper.ToDto).ToList());
    }
}
