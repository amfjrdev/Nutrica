using NP.Domain.Abstractions;

namespace NP.Domain.Payments;

public static class PaymentErrors
{
    public static readonly Error InvalidClientId = new("Payment.InvalidClientId", "Client ID is invalid.");
    public static readonly Error InvalidAmount = new("Payment.InvalidAmount", "Amount must be greater than zero.");
    public static readonly Error InvalidStripeId = new("Payment.InvalidStripeId", "Stripe payment intent ID is required.");
    public static readonly Error NotFound = new("Payment.NotFound", "Payment not found.");
    public static readonly Error AlreadyProcessed = new("Payment.AlreadyProcessed", "Payment has already been processed.");
}
