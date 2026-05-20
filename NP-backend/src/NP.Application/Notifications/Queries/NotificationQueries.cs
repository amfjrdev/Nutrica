using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Notifications;
using NP.Domain.Notifications.Repositories;

namespace NP.Application.Notifications.Queries;

public sealed record NotificationDto(
    Guid Id, Guid UserId, string Title, string Message,
    string Type, string SenderRole, string ReceiverRole,
    bool IsRead, DateTime CreatedAt);

public sealed record GetNotificationsByUserQuery(Guid UserId) : IQuery<List<NotificationDto>>;

internal sealed class GetNotificationsByUserQueryHandler : IQueryHandler<GetNotificationsByUserQuery, List<NotificationDto>>
{
    private readonly INotificationRepository _repo;
    public GetNotificationsByUserQueryHandler(INotificationRepository repo) => _repo = repo;

    public async Task<Result<List<NotificationDto>>> HandleAsync(GetNotificationsByUserQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _repo.GetByUserIdAsync(query.UserId, cancellationToken);
        return Result.Success(list.Select(n => new NotificationDto(
            n.Id, n.UserId, n.Title, n.Message,
            n.Type.ToString().ToLowerInvariant(), n.SenderRole, n.ReceiverRole,
            n.IsRead, n.CreatedAt)).ToList());
    }
}
