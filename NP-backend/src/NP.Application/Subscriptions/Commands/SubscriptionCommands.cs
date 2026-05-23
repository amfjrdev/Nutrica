using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Clients.Repositories;
using NP.Domain.Subscriptions;
using NP.Domain.Subscriptions.Repositories;
using NP.Domain.Users.Repositories;

namespace NP.Application.Subscriptions.Commands;

public sealed record CreateSubscriptionCommand(Guid ClientId, Guid? NutritionistId, Guid? NutritionPlanId, string Type, DateTime StartsAt, DateTime ExpiresAt) : ICommand<Guid>;

public sealed record CancelSubscriptionCommand(Guid SubscriptionId) : ICommand;

internal sealed class CreateSubscriptionCommandHandler : ICommandHandler<CreateSubscriptionCommand, Guid>
{
    private readonly ISubscriptionRepository _repo;
    private readonly IClientRepository _clientRepository;
    private readonly NotificationDispatcher _dispatcher;

    public CreateSubscriptionCommandHandler(ISubscriptionRepository repo, IClientRepository clientRepository, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _clientRepository = clientRepository;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(CreateSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<SubscriptionType>(command.Type, out var type))
            return Result.Failure<Guid>(new Error("Subscription.InvalidType", "Invalid subscription type."));


        var result = Subscription.Create(command.ClientId, command.NutritionistId, command.NutritionPlanId, type, command.StartsAt, command.ExpiresAt);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        await _dispatcher.ClientActedAsync(null,
            "New Subscription Pending",
            $"A client subscribed to the {type} plan and is awaiting payment approval.", cancellationToken);

        return Result.Success(result.Value.Id);
    }
}

internal sealed class CancelSubscriptionCommandHandler : ICommandHandler<CancelSubscriptionCommand>
{
    private readonly ISubscriptionRepository _repo;
    private readonly IClientRepository _clientRepository;
    private readonly NotificationDispatcher _dispatcher;

    public CancelSubscriptionCommandHandler(ISubscriptionRepository repo, IClientRepository clientRepository, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _clientRepository = clientRepository;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(CancelSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        var sub = await _repo.GetByIdAsync(command.SubscriptionId, cancellationToken);
        if (sub is null) return Result.Failure(SubscriptionErrors.NotFound);

        var result = sub.Cancel();
        if (result.IsFailure) return result;

        _repo.Update(sub);

        var client = await _clientRepository.GetByIdAsync(sub.ClientId, cancellationToken);
        if (client is not null)
            await _dispatcher.AdminRejectedAsync(client.UserId,
                "Subscription Cancelled",
                "Your subscription has been cancelled.", cancellationToken);

        return Result.Success();
    }
}
