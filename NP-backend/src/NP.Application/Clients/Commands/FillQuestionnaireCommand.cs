using NP.Application.Abstractions.Messaging;
using NP.Application.Notifications;
using NP.Domain.Abstractions;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;

namespace NP.Application.Clients.Commands;

public sealed record FillQuestionnaireCommand(
    Guid ClientId,
    string Goal,
    string? MedicalConditions,
    string? FoodAllergies,
    string ActivityLevel,
    decimal Weight,
    decimal Height,
    int Age,
    string Gender
) : ICommand;

internal sealed class FillQuestionnaireCommandHandler : ICommandHandler<FillQuestionnaireCommand>
{
    private readonly IClientRepository _clientRepository;
    private readonly NotificationDispatcher _dispatcher;

    public FillQuestionnaireCommandHandler(
        IClientRepository clientRepository,
        NotificationDispatcher dispatcher)
    {
        _clientRepository = clientRepository;
        _dispatcher = dispatcher;
    }

    public async Task<Result> HandleAsync(FillQuestionnaireCommand command, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByIdAsync(command.ClientId, cancellationToken);
        if (client is null) return Result.Failure(ClientErrors.NotFound);

        var result = client.FillQuestionnaire(command.Goal, command.MedicalConditions, command.FoodAllergies,
            command.ActivityLevel, command.Weight, command.Height, command.Age, command.Gender);

        if (result.IsFailure) return result;

        _clientRepository.Update(client);

        await _dispatcher.ClientActedAsync(null,
            "Questionnaire Submitted",
            "A client has completed their health questionnaire.", cancellationToken);

        return Result.Success();
    }
}
