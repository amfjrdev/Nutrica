using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Messaging;
using NP.Application.Auth.Commands;

namespace NP.API.Endpoints.Auth;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/register",    Register).AllowAnonymous().WithSummary("Register a new user");
        group.MapPost("/login",       Login).AllowAnonymous().WithSummary("Step 1: validate credentials and send OTP");
        group.MapPost("/verify-otp",  VerifyOtp).AllowAnonymous().WithSummary("Step 2: verify OTP and receive JWT");
        group.MapPost("/resend-otp",  ResendOtp).AllowAnonymous().WithSummary("Resend OTP (60s cooldown)");
        return group;
    }

    private static async Task<Results<Ok<AuthResult>, ProblemHttpResult>> Register(
        [FromBody] RegisterRequest request,
        ICommandHandler<RegisterCommand, AuthResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(
            new RegisterCommand(request.Email, request.Password, request.FirstName, request.LastName, request.PhoneNumber, request.Role),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    // Step 1 — validates credentials, sends OTP, returns pending indicator (no JWT)
    private static async Task<Results<Ok<OtpPendingResult>, ProblemHttpResult>> Login(
        [FromBody] LoginRequest request,
        ICommandHandler<InitiateLoginCommand, OtpPendingResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(
            new InitiateLoginCommand(request.Email, request.Password), cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    // Step 2 — verifies OTP, issues JWT on success
    private static async Task<Results<Ok<AuthResult>, ProblemHttpResult>> VerifyOtp(
        [FromBody] VerifyOtpRequest request,
        ICommandHandler<VerifyOtpCommand, AuthResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(
            new VerifyOtpCommand(request.Email, request.Otp), cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    // Bonus — resend OTP with cooldown
    private static async Task<Results<Ok<OtpPendingResult>, ProblemHttpResult>> ResendOtp(
        [FromBody] ResendOtpRequest request,
        ICommandHandler<ResendOtpCommand, OtpPendingResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(
            new ResendOtpCommand(request.Email), cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record RegisterRequest(string Email, string Password, string FirstName, string LastName, string? PhoneNumber, string Role);
public sealed record LoginRequest(string Email, string Password);
public sealed record VerifyOtpRequest(string Email, string Otp);
public sealed record ResendOtpRequest(string Email);
