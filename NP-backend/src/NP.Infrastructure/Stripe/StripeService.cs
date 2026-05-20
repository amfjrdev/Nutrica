using Microsoft.Extensions.Options;
using NP.Application.Abstractions.Stripe;
using Stripe;

namespace NP.Infrastructure.Stripe;

internal sealed class StripeService : IStripeService
{
    private readonly StripeOptions _options;

    public StripeService(IOptions<StripeOptions> options)
    {
        _options = options.Value;
        StripeConfiguration.ApiKey = _options.SecretKey;
    }

    public async Task<StripePaymentIntentResult> CreatePaymentIntentAsync(decimal amount, string currency, string description, CancellationToken cancellationToken = default)
    {
        var service = new PaymentIntentService();

        var intent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = (long)(amount * 100),
            Currency = currency.ToLowerInvariant(),
            Description = description,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true }
        }, cancellationToken: cancellationToken);

        return new StripePaymentIntentResult(intent.Id, intent.ClientSecret);
    }

    public StripeWebhookEvent? ParseWebhookEvent(string payload, string signature)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(payload, signature, _options.WebhookSecret);

            if (stripeEvent.Data.Object is not PaymentIntent intent)
                return null;

            return new StripeWebhookEvent(stripeEvent.Type, intent.Id);
        }
        catch
        {
            return null;
        }
    }
}
