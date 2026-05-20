using NP.Application.Abstractions.Notifications;
using NP.Domain.Clients.Repositories;
using NP.Domain.Notifications;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Users.Repositories;

namespace NP.Application.Notifications;

/// <summary>
/// Encodes all business notification rules.
/// Resolves recipient user IDs and delegates delivery to INotificationService.
/// </summary>
public sealed class NotificationDispatcher
{
    private readonly INotificationService _notificationService;
    private readonly IUserRepository _userRepository;
    private readonly IClientRepository _clientRepository;
    private readonly INutritionistRepository _nutritionistRepository;

    public NotificationDispatcher(
        INotificationService notificationService,
        IUserRepository userRepository,
        IClientRepository clientRepository,
        INutritionistRepository nutritionistRepository)
    {
        _notificationService = notificationService;
        _userRepository = userRepository;
        _clientRepository = clientRepository;
        _nutritionistRepository = nutritionistRepository;
    }

    // ── Admin actions ─────────────────────────────────────────────────────────

    /// <summary>Admin approved something → notify the client.</summary>
    public Task AdminApprovedAsync(Guid clientUserId, string title, string message,
        CancellationToken ct = default) =>
        _notificationService.SendAsync(
            new NotificationPayload(clientUserId, title, message,
                NotificationType.Success, "Admin", "Client"), ct);

    /// <summary>Admin rejected something → notify the client.</summary>
    public Task AdminRejectedAsync(Guid clientUserId, string title, string message,
        CancellationToken ct = default) =>
        _notificationService.SendAsync(
            new NotificationPayload(clientUserId, title, message,
                NotificationType.Error, "Admin", "Client"), ct);

    /// <summary>Admin updated something → notify client + nutritionist (if assigned).</summary>
    public async Task AdminUpdatedAsync(Guid clientUserId, Guid? nutritionistUserId,
        string title, string message, CancellationToken ct = default)
    {
        var payloads = new List<NotificationPayload>
        {
            new(clientUserId, title, message, NotificationType.Info, "Admin", "Client")
        };

        if (nutritionistUserId.HasValue)
            payloads.Add(new(nutritionistUserId.Value, title, message,
                NotificationType.Info, "Admin", "Nutritionist"));

        await _notificationService.SendManyAsync(payloads, ct);
    }

    // ── Client actions ────────────────────────────────────────────────────────

    /// <summary>Client did something → notify Admin + assigned Nutritionist (if any).</summary>
    public async Task ClientActedAsync(Guid? nutritionistUserId,
        string title, string message, CancellationToken ct = default)
    {
        var admins = await _userRepository.GetByRoleAsync("Admin", ct);
        var payloads = admins
            .Select(a => new NotificationPayload(a.Id, title, message,
                NotificationType.Info, "Client", "Admin"))
            .ToList();

        if (nutritionistUserId.HasValue)
            payloads.Add(new(nutritionistUserId.Value, title, message,
                NotificationType.Info, "Client", "Nutritionist"));

        await _notificationService.SendManyAsync(payloads, ct);
    }

    // ── Nutritionist actions ──────────────────────────────────────────────────

    /// <summary>Nutritionist updated plan/recommendation → notify the client only.</summary>
    public Task NutritionistUpdatedAsync(Guid clientUserId, string title, string message,
        CancellationToken ct = default) =>
        _notificationService.SendAsync(
            new NotificationPayload(clientUserId, title, message,
                NotificationType.Info, "Nutritionist", "Client"), ct);

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Resolves the UserId of a Client entity's owner.</summary>
    public async Task<Guid?> GetClientUserIdAsync(Guid clientId, CancellationToken ct = default)
    {
        var client = await _clientRepository.GetByIdAsync(clientId, ct);
        return client?.UserId;
    }

    /// <summary>Resolves the UserId of a Nutritionist entity's owner.</summary>
    public async Task<Guid?> GetNutritionistUserIdAsync(Guid nutritionistId, CancellationToken ct = default)
    {
        var nutritionist = await _nutritionistRepository.GetByIdAsync(nutritionistId, ct);
        return nutritionist?.UserId;
    }
}
