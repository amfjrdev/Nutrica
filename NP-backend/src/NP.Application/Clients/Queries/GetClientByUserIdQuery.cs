using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Clients.Queries;

public sealed record ClientDto(Guid Id, Guid UserId, string? Goal, string? ActivityLevel, decimal? Weight,
    decimal? Height, int? Age, string? Gender, string? MedicalConditions, string? FoodAllergies, bool QuestionnaireCompleted);

// Returned by GET /api/clients/access — single source of truth for frontend access gating
public sealed record ClientAccessDto(
    bool HasActiveSubscription,
    bool HasPendingSubscription,
    string? SubscriptionType,       // "Predefined" | "Personalized" | "AI" | null
    Guid? SubscriptionId,           // used as chat room ID for Personalized plan
    Guid? NutritionPlanId,          // set for Plan A — unlocks only that plan page
    Guid? NutritionistId,           // assigned nutritionist for Personalized plan
    bool QuestionnaireCompleted
);

public sealed record GetClientAccessQuery(Guid UserId) : IQuery<ClientAccessDto>;

internal sealed class GetClientAccessQueryHandler : IQueryHandler<GetClientAccessQuery, ClientAccessDto>
{
    private readonly IClientRepository _clientRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;

    public GetClientAccessQueryHandler(IClientRepository clientRepository, ISubscriptionRepository subscriptionRepository)
    {
        _clientRepository = clientRepository;
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<Result<ClientAccessDto>> HandleAsync(GetClientAccessQuery query, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByUserIdAsync(query.UserId, cancellationToken);
        if (client is null) return Result.Failure<ClientAccessDto>(ClientErrors.NotFound);

        var activeSub  = await _subscriptionRepository.GetActiveByClientIdAsync(client.Id, cancellationToken);
        var pendingSub = await _subscriptionRepository.GetPendingByClientIdAsync(client.Id, cancellationToken);

        var sub = activeSub ?? pendingSub;

        return Result.Success(new ClientAccessDto(
            HasActiveSubscription:  activeSub is not null,
            HasPendingSubscription: pendingSub is not null,
            SubscriptionType:       sub?.Type.ToString(),
            SubscriptionId:         sub?.Id,
            NutritionPlanId:        sub?.NutritionPlanId,
            NutritionistId:         sub?.NutritionistId,
            QuestionnaireCompleted: client.QuestionnaireCompleted
        ));
    }
}

public sealed record GetClientByUserIdQuery(Guid UserId) : IQuery<ClientDto>;

internal sealed class GetClientByUserIdQueryHandler : IQueryHandler<GetClientByUserIdQuery, ClientDto>
{
    private readonly IClientRepository _clientRepository;

    public GetClientByUserIdQueryHandler(IClientRepository clientRepository) => _clientRepository = clientRepository;

    public async Task<Result<ClientDto>> HandleAsync(GetClientByUserIdQuery query, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByUserIdAsync(query.UserId, cancellationToken);
        if (client is null) return Result.Failure<ClientDto>(ClientErrors.NotFound);

        return Result.Success(new ClientDto(client.Id, client.UserId, client.Goal, client.ActivityLevel,
            client.Weight, client.Height, client.Age, client.Gender, client.MedicalConditions, client.FoodAllergies, client.QuestionnaireCompleted));
    }
}
