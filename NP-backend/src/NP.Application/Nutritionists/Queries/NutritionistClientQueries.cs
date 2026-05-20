using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Chat;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Subscriptions.Repositories;
using NP.Domain.Users.Repositories;

namespace NP.Application.Nutritionists.Queries;

// --- DTOs ---

public sealed record ClientSummaryDto(Guid ClientId, Guid UserId, string Email, string FirstName, string LastName,
    string? Goal, string? ActivityLevel, bool QuestionnaireCompleted);

// Used by nutritionist chat — lists Personalized clients with their subscriptionId (chat room)
public sealed record PersonalizedClientDto(
    Guid ClientId,
    string FirstName,
    string LastName,
    Guid SubscriptionId,
    string? LastMessage,
    DateTime? LastMessageAt
);

public sealed record ClientQuestionnaireDto(Guid ClientId, string? Goal, string? MedicalConditions,
    string? FoodAllergies, string? ActivityLevel, decimal? Weight, decimal? Height, int? Age, string? Gender);

public sealed record ClientSubscriptionDto(Guid ClientId, string? SubscriptionType, string? SubscriptionStatus, DateTime? ExpiresAt);

public sealed record ClientFeedbackSummaryDto(Guid FeedbackId, Guid NutritionPlanId, string Comment, int Rating, DateTime CreatedAt);

// --- Queries ---

public sealed record GetNutritionistClientsQuery(Guid NutritionistId) : IQuery<List<ClientSummaryDto>>;

public sealed record GetNutritionistPersonalizedClientsQuery(Guid NutritionistId) : IQuery<List<PersonalizedClientDto>>;

public sealed record GetClientQuestionnaireQuery(Guid ClientId) : IQuery<ClientQuestionnaireDto>;

public sealed record GetClientSubscriptionTypeQuery(Guid ClientId) : IQuery<ClientSubscriptionDto>;

public sealed record GetClientFeedbacksQuery(Guid ClientId) : IQuery<List<ClientFeedbackSummaryDto>>;

// --- Handlers ---

internal sealed class GetNutritionistClientsQueryHandler : IQueryHandler<GetNutritionistClientsQuery, List<ClientSummaryDto>>
{
    private readonly IClientRepository _clientRepository;
    private readonly IUserRepository _userRepository;

    public GetNutritionistClientsQueryHandler(
        IClientRepository clientRepository,
        IUserRepository userRepository)
    {
        _clientRepository = clientRepository;
        _userRepository = userRepository;
    }

    public async Task<Result<List<ClientSummaryDto>>> HandleAsync(GetNutritionistClientsQuery query, CancellationToken cancellationToken = default)
    {
        // Return all clients who completed the questionnaire
        var allClients = await _clientRepository.GetAllAsync(cancellationToken);
        var clients = allClients.Where(c => c.QuestionnaireCompleted).ToList();

        var result = new List<ClientSummaryDto>();
        foreach (var client in clients)
        {
            var user = await _userRepository.GetByIdAsync(client.UserId, cancellationToken);
            if (user is null) continue;

            result.Add(new ClientSummaryDto(client.Id, client.UserId, user.Email, user.FirstName, user.LastName,
                client.Goal, client.ActivityLevel, client.QuestionnaireCompleted));
        }

        return Result.Success(result);
    }
}

internal sealed class GetClientQuestionnaireQueryHandler : IQueryHandler<GetClientQuestionnaireQuery, ClientQuestionnaireDto>
{
    private readonly IClientRepository _clientRepository;

    public GetClientQuestionnaireQueryHandler(IClientRepository clientRepository) => _clientRepository = clientRepository;

    public async Task<Result<ClientQuestionnaireDto>> HandleAsync(GetClientQuestionnaireQuery query, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByIdAsync(query.ClientId, cancellationToken);
        if (client is null) return Result.Failure<ClientQuestionnaireDto>(ClientErrors.NotFound);

        return Result.Success(new ClientQuestionnaireDto(client.Id, client.Goal, client.MedicalConditions,
            client.FoodAllergies, client.ActivityLevel, client.Weight, client.Height, client.Age, client.Gender));
    }
}

internal sealed class GetClientSubscriptionTypeQueryHandler : IQueryHandler<GetClientSubscriptionTypeQuery, ClientSubscriptionDto>
{
    private readonly ISubscriptionRepository _subscriptionRepository;

    public GetClientSubscriptionTypeQueryHandler(ISubscriptionRepository subscriptionRepository) =>
        _subscriptionRepository = subscriptionRepository;

    public async Task<Result<ClientSubscriptionDto>> HandleAsync(GetClientSubscriptionTypeQuery query, CancellationToken cancellationToken = default)
    {
        var sub = await _subscriptionRepository.GetActiveByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(new ClientSubscriptionDto(query.ClientId,
            sub?.Type.ToString(), sub?.Status.ToString(), sub?.ExpiresAt));
    }
}

internal sealed class GetClientFeedbacksQueryHandler : IQueryHandler<GetClientFeedbacksQuery, List<ClientFeedbackSummaryDto>>
{
    private readonly IFeedbackRepository _feedbackRepository;

    public GetClientFeedbacksQueryHandler(IFeedbackRepository feedbackRepository) => _feedbackRepository = feedbackRepository;

    public async Task<Result<List<ClientFeedbackSummaryDto>>> HandleAsync(GetClientFeedbacksQuery query, CancellationToken cancellationToken = default)
    {
        var feedbacks = await _feedbackRepository.GetByClientIdAsync(query.ClientId, cancellationToken);
        return Result.Success(feedbacks.Select(f =>
            new ClientFeedbackSummaryDto(f.Id, f.NutritionPlanId, f.Comment, f.Rating, f.CreatedAt)).ToList());
    }
}

internal sealed class GetNutritionistPersonalizedClientsQueryHandler : IQueryHandler<GetNutritionistPersonalizedClientsQuery, List<PersonalizedClientDto>>
{
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IClientRepository _clientRepository;
    private readonly IUserRepository _userRepository;
    private readonly IChatMessageRepository _chatRepository;

    public GetNutritionistPersonalizedClientsQueryHandler(
        ISubscriptionRepository subscriptionRepository,
        IClientRepository clientRepository,
        IUserRepository userRepository,
        IChatMessageRepository chatRepository)
    {
        _subscriptionRepository = subscriptionRepository;
        _clientRepository = clientRepository;
        _userRepository = userRepository;
        _chatRepository = chatRepository;
    }

    public async Task<Result<List<PersonalizedClientDto>>> HandleAsync(GetNutritionistPersonalizedClientsQuery query, CancellationToken cancellationToken = default)
    {
        var allSubs = await _subscriptionRepository.GetAllAsync(cancellationToken);
        // Include subscriptions assigned to this nutritionist OR unassigned ones
        var assigned = allSubs
            .Where(s => (s.NutritionistId == query.NutritionistId || s.NutritionistId == null)
                     && s.Type == NP.Domain.Subscriptions.SubscriptionType.Personalized
                     && s.Status == NP.Domain.Subscriptions.SubscriptionStatus.Active)
            .ToList();

        // Fetch last message for all rooms in one query
        var lastMessages = await _chatRepository.GetLastMessagePerRoomAsync(
            assigned.Select(s => s.Id), cancellationToken);

        var result = new List<PersonalizedClientDto>();
        foreach (var sub in assigned)
        {
            var client = await _clientRepository.GetByIdAsync(sub.ClientId, cancellationToken);
            if (client is null) continue;
            var user = await _userRepository.GetByIdAsync(client.UserId, cancellationToken);
            if (user is null) continue;

            lastMessages.TryGetValue(sub.Id, out var last);
            result.Add(new PersonalizedClientDto(
                client.Id,
                user.FirstName,
                user.LastName,
                sub.Id,
                last?.Message,
                last?.SentAt));
        }

        // Sort by most recent message first, clients with no messages go last
        return Result.Success(result
            .OrderByDescending(c => c.LastMessageAt ?? DateTime.MinValue)
            .ToList());
    }
}
