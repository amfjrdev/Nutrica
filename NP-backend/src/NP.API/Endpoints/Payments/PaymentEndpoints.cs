using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NP.API.Extensions;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Messaging;
using NP.Application.Abstractions.Stripe;
using NP.Application.Payments.Commands;
using NP.Application.Payments.Queries;
using NP.Domain.Clients.Repositories;

namespace NP.API.Endpoints.Payments;

public static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/initiate", Initiate)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Create Stripe payment intent and subscription");

        group.MapPost("/mock", Mock)
            .RequireAuthorization("ClientOnly")
            .WithSummary("DEV ONLY — Create payment record without Stripe");

        group.MapPost("/webhook/stripe", StripeWebhook)
            .AllowAnonymous()
            .WithSummary("Stripe webhook — confirms or fails payment");

        group.MapGet("/", GetAll)
            .RequireAuthorization("AdminOnly")
            .WithSummary("Get all payment records");

        group.MapGet("/pending", GetPending)
            .RequireAuthorization("AdminOnly")
            .WithSummary("Get all pending payments");

        group.MapPut("/{id:guid}/approve", Approve)
            .RequireAuthorization("AdminOnly")
            .WithSummary("Admin manually approves a payment");

        group.MapGet("/my", GetMy)
            .RequireAuthorization("ClientOnly")
            .WithSummary("Get my payment history");

        return group;
    }

    private static async Task<Results<Ok<Guid>, ProblemHttpResult>> Mock(
        [FromBody] MockPaymentRequest request,
        ICommandHandler<MockPaymentCommand, Guid> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null)
            return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new MockPaymentCommand(client.Id, request.SubscriptionType, request.Amount, request.Currency),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<InitiatePaymentResult>, ProblemHttpResult>> Initiate(
        [FromBody] InitiatePaymentRequest request,
        ICommandHandler<InitiatePaymentCommand, InitiatePaymentResult> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null)
            return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(
            new InitiatePaymentCommand(client.Id, request.NutritionistId, request.NutritionPlanId,
                request.SubscriptionType, request.Amount, request.Currency),
            cancellationToken);

        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok, BadRequest<string>>> StripeWebhook(
        HttpRequest httpRequest,
        IStripeService stripeService,
        ICommandHandler<ConfirmPaymentCommand> confirmHandler,
        ICommandHandler<FailPaymentCommand> failHandler,
        CancellationToken cancellationToken)
    {
        var payload = await new StreamReader(httpRequest.Body).ReadToEndAsync(cancellationToken);
        var signature = httpRequest.Headers["Stripe-Signature"].FirstOrDefault() ?? string.Empty;

        var webhookEvent = stripeService.ParseWebhookEvent(payload, signature);
        if (webhookEvent is null)
            return TypedResults.BadRequest("Invalid webhook signature.");

        if (webhookEvent.EventType == "payment_intent.succeeded")
            await confirmHandler.HandleAsync(new ConfirmPaymentCommand(webhookEvent.PaymentIntentId), cancellationToken);
        else if (webhookEvent.EventType == "payment_intent.payment_failed")
            await failHandler.HandleAsync(new FailPaymentCommand(webhookEvent.PaymentIntentId), cancellationToken);

        return TypedResults.Ok();
    }

    private static async Task<Results<Ok<List<PaymentDto>>, ProblemHttpResult>> GetAll(
        IQueryHandler<GetAllPaymentsQuery, List<PaymentDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAllPaymentsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<List<PaymentDto>>, ProblemHttpResult>> GetPending(
        IQueryHandler<GetPendingPaymentsQuery, List<PaymentDto>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetPendingPaymentsQuery(), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Approve(
        Guid id,
        ICommandHandler<ApprovePaymentCommand> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ApprovePaymentCommand(id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.NoContent();
    }

    private static async Task<Results<Ok<List<PaymentDto>>, ProblemHttpResult>> GetMy(
        IQueryHandler<GetPaymentsByClientQuery, List<PaymentDto>> handler,
        IUserContext userContext,
        IClientRepository clientRepository,
        CancellationToken cancellationToken)
    {
        var client = await clientRepository.GetByUserIdAsync(userContext.UserId, cancellationToken);
        if (client is null)
            return TypedResults.Problem(title: "Not Found", detail: "Client not found.", statusCode: 404);

        var result = await handler.HandleAsync(new GetPaymentsByClientQuery(client.Id), cancellationToken);
        return result.IsFailure ? result.Error.ToProblem() : TypedResults.Ok(result.Value);
    }
}

public sealed record InitiatePaymentRequest(Guid? NutritionistId, Guid? NutritionPlanId, string SubscriptionType, decimal Amount, string Currency);
public sealed record MockPaymentRequest(string SubscriptionType, decimal Amount, string Currency);
