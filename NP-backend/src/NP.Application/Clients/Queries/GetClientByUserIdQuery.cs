using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;

namespace NP.Application.Clients.Queries;

public sealed record ClientDto(Guid Id, Guid UserId, string? Goal, string? ActivityLevel, decimal? Weight,
    decimal? Height, int? Age, string? Gender, string? MedicalConditions, string? FoodAllergies, bool QuestionnaireCompleted);

// Returned by GET /api/clients/access — single source of truth for frontend access gating
public sealed record ClientAccessDto(
    bool HasActiveSubscription,
    bool HasPendingSubscription,
    string? SubscriptionType,
    Guid? SubscriptionId,
    Guid? NutritionPlanId,
    Guid? NutritionistId,
    bool QuestionnaireCompleted,
    bool HasPredefined,
    bool HasPersonalized,
    bool HasAI,
    List<Guid> UnlockedPlanIds,
    List<Guid> PendingPlanIds
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

        // Fetch all client subscriptions to gather multiple predefined plans
        var clientSubs = await _subscriptionRepository.GetByClientIdAsync(client.Id, cancellationToken);

        var activeOrPendingSubs = clientSubs
            .Where(s => s.ExpiresAt > DateTime.UtcNow && (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.PendingApproval))
            .ToList();

        var predefinedSubs   = activeOrPendingSubs.Where(s => s.Type == SubscriptionType.Predefined).ToList();
        var personalizedSub  = activeOrPendingSubs.FirstOrDefault(s => s.Type == SubscriptionType.Personalized);
        var aiSub            = activeOrPendingSubs.FirstOrDefault(s => s.Type == SubscriptionType.AI);

        var predefinedSub = predefinedSubs.FirstOrDefault(s => s.Status == SubscriptionStatus.Active)
                         ?? predefinedSubs.FirstOrDefault();

        // Primary sub for backward-compat fields: prefer Personalized > Predefined > AI
        var primarySub = personalizedSub ?? predefinedSub ?? aiSub;

        // Gather all active unlocked predefined plan IDs
        var unlockedPlanIds = predefinedSubs
            .Where(s => s.Status == SubscriptionStatus.Active && s.NutritionPlanId.HasValue)
            .Select(s => s.NutritionPlanId!.Value)
            .ToList();

        // Gather all pending predefined plan IDs
        var pendingPlanIds = predefinedSubs
            .Where(s => s.Status == SubscriptionStatus.PendingApproval && s.NutritionPlanId.HasValue)
            .Select(s => s.NutritionPlanId!.Value)
            .ToList();

        return Result.Success(new ClientAccessDto(
            HasActiveSubscription:  primarySub?.Status == SubscriptionStatus.Active,
            HasPendingSubscription: primarySub?.Status == SubscriptionStatus.PendingApproval,
            SubscriptionType:       primarySub?.Type.ToString(),
            SubscriptionId:         primarySub?.Id,
            NutritionPlanId:        predefinedSub?.NutritionPlanId ?? personalizedSub?.NutritionPlanId,
            NutritionistId:         personalizedSub?.NutritionistId,
            QuestionnaireCompleted: client.QuestionnaireCompleted,
            HasPredefined:          predefinedSubs.Any(s => s.Status == SubscriptionStatus.Active),
            HasPersonalized:        personalizedSub?.Status == SubscriptionStatus.Active,
            HasAI:                  aiSub?.Status == SubscriptionStatus.Active,
            UnlockedPlanIds:        unlockedPlanIds,
            PendingPlanIds:         pendingPlanIds
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
