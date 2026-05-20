using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Domain.Abstractions;
using NP.Domain.Admins;
using NP.Domain.Admins.Repositories;
using NP.Domain.Clients;
using NP.Domain.Clients.Repositories;
using NP.Domain.Nutritionists;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Users;
using NP.Domain.Users.Repositories;

namespace NP.Application.Auth.Commands;

internal sealed class RegisterCommandHandler : ICommandHandler<RegisterCommand, AuthResult>
{
    private readonly IUserRepository _userRepository;
    private readonly IClientRepository _clientRepository;
    private readonly INutritionistRepository _nutritionistRepository;
    private readonly IAdminRepository _adminRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public RegisterCommandHandler(
        IUserRepository userRepository,
        IClientRepository clientRepository,
        INutritionistRepository nutritionistRepository,
        IAdminRepository adminRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _clientRepository = clientRepository;
        _nutritionistRepository = nutritionistRepository;
        _adminRepository = adminRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResult>> HandleAsync(RegisterCommand command, CancellationToken cancellationToken = default)
    {
        var allowedRoles = new[] { "Client", "Nutritionist", "Admin" };
        if (!allowedRoles.Contains(command.Role))
            return Result.Failure<AuthResult>(new Error("Auth.InvalidRole", "Role must be Client, Nutritionist, or Admin."));

        if (await _userRepository.ExistsByEmailAsync(command.Email, cancellationToken))
            return Result.Failure<AuthResult>(UserErrors.EmailAlreadyExists);

        var userResult = User.Create(command.Email, command.FirstName, command.LastName, command.PhoneNumber);
        if (userResult.IsFailure) return Result.Failure<AuthResult>(userResult.Error);

        var user = userResult.Value;
        user.SetPasswordHash(_passwordHasher.Hash(command.Password));
        user.SetRole(command.Role);

        await _userRepository.AddAsync(user, cancellationToken);

        if (command.Role == "Client")
        {
            var client = Client.Create(user.Id);
            if (client.IsFailure) return Result.Failure<AuthResult>(client.Error);
            await _clientRepository.AddAsync(client.Value, cancellationToken);
        }
        else if (command.Role == "Nutritionist")
        {
            var nutritionist = Nutritionist.Create(user.Id);
            if (nutritionist.IsFailure) return Result.Failure<AuthResult>(nutritionist.Error);
            await _nutritionistRepository.AddAsync(nutritionist.Value, cancellationToken);
        }
        else if (command.Role == "Admin")
        {
            var admin = Admin.Create(user.Id);
            if (admin.IsFailure) return Result.Failure<AuthResult>(admin.Error);
            await _adminRepository.AddAsync(admin.Value, cancellationToken);
        }

        var token = _jwtService.GenerateToken(user, command.Role);
        return Result.Success(new AuthResult(user.Id, user.Email, user.FirstName, user.LastName, command.Role, token));
    }
}
