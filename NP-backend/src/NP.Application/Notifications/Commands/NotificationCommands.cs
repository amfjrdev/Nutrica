using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Notifications;
using NP.Domain.Notifications.Repositories;

namespace NP.Application.Notifications.Commands;

public sealed record SendNotificationCommand(Guid UserId, string Title, string Message) : ICommand;

public sealed record MarkNotificationReadCommand(Guid NotificationId) : ICommand;

internal sealed class SendNotificationCommandHandler : ICommandHandler<SendNotificationCommand>
{
    private readonly INotificationRepository _repo;
    public SendNotificationCommandHandler(INotificationRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(SendNotificationCommand command, CancellationToken cancellationToken = default)
    {
        var result = Notification.Create(command.UserId, command.Title, command.Message,
            NotificationType.Info, "Admin", "Client");
        if (result.IsFailure) return result;

        await _repo.AddAsync(result.Value, cancellationToken);
        return Result.Success();
    }
}

internal sealed class MarkNotificationReadCommandHandler : ICommandHandler<MarkNotificationReadCommand>
{
    private readonly INotificationRepository _repo;
    public MarkNotificationReadCommandHandler(INotificationRepository repo) => _repo = repo;

    public async Task<Result> HandleAsync(MarkNotificationReadCommand command, CancellationToken cancellationToken = default)
    {
        var notification = await _repo.GetByIdAsync(command.NotificationId, cancellationToken);
        if (notification is null) return Result.Failure(NotificationErrors.NotFound);

        notification.MarkAsRead();
        _repo.Update(notification);
        return Result.Success();
    }
}
