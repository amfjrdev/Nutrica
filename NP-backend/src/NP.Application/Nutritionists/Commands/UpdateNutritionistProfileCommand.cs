using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;

namespace NP.Application.Nutritionists.Commands;

public sealed record UpdateNutritionistProfileCommand(Guid NutritionistId, string Bio, string Specialization, string? CertificateUrl) : ICommand;

internal sealed class UpdateNutritionistProfileCommandHandler : ICommandHandler<UpdateNutritionistProfileCommand>
{
    private readonly INutritionistRepository _nutritionistRepository;

    public UpdateNutritionistProfileCommandHandler(INutritionistRepository nutritionistRepository) =>
        _nutritionistRepository = nutritionistRepository;

    public async Task<Result> HandleAsync(UpdateNutritionistProfileCommand command, CancellationToken cancellationToken = default)
    {
        var nutritionist = await _nutritionistRepository.GetByIdAsync(command.NutritionistId, cancellationToken);
        if (nutritionist is null) return Result.Failure(NutritionistErrors.NotFound);

        var result = nutritionist.UpdateProfile(command.Bio, command.Specialization, command.CertificateUrl);
        if (result.IsFailure) return result;

        _nutritionistRepository.Update(nutritionist);
        return Result.Success();
    }
}
