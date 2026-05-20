namespace NP.Application.Abstractions.Stripe;

public interface IStripeService
{
    Task<StripePaymentIntentResult> CreatePaymentIntentAsync(decimal amount, string currency, string description, CancellationToken cancellationToken = default);
    StripeWebhookEvent? ParseWebhookEvent(string payload, string signature);
}

public sealed record StripePaymentIntentResult(string PaymentIntentId, string ClientSecret);

public sealed record StripeWebhookEvent(string EventType, string PaymentIntentId);
