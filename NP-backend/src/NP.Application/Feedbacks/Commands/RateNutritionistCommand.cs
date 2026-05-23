using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Feedbacks;
using NP.Domain.Feedbacks.Repositories;

namespace NP.Application.Feedbacks.Commands;

public sealed record RateNutritionistCommand(Guid ClientId, Guid NutritionistId, int Rating, string Comment) : ICommand<Guid>;

internal sealed class RateNutritionistCommandHandler : ICommandHandler<RateNutritionistCommand, Guid>
{
    private readonly INutritionistRatingRepository _repo;
    private readonly NotificationDispatcher _dispatcher;

    public RateNutritionistCommandHandler(INutritionistRatingRepository repo, NotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task<Result<Guid>> HandleAsync(RateNutritionistCommand command, CancellationToken cancellationToken = default)
    {
        // one rating per client per nutritionist
        var existing = await _repo.GetByClientAndNutritionistAsync(command.ClientId, command.NutritionistId, cancellationToken);
        if (existing is not null)
            return Result.Failure<Guid>(new Error("Rating.AlreadyRated", "You have already rated this nutritionist."));

        var result = NutritionistRating.Create(command.ClientId, command.NutritionistId, command.Rating, command.Comment);
        if (result.IsFailure) return Result.Failure<Guid>(result.Error);

        await _repo.AddAsync(result.Value, cancellationToken);

        var nutritionistUserId = await _dispatcher.GetNutritionistUserIdAsync(command.NutritionistId, cancellationToken);
        if (nutritionistUserId.HasValue)
            await _dispatcher.NutritionistUpdatedAsync(nutritionistUserId.Value,
                "New Rating Received",
                $"A client rated you {command.Rating}/5 stars.", cancellationToken);

        return Result.Success(result.Value.Id);
    }
}
