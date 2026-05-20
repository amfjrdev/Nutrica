using NP.API.Endpoints.AI;
using NP.API.Endpoints.Appointments;
using NP.API.Endpoints.Auth;
using NP.API.Endpoints.Clients;
using NP.API.Endpoints.Feedbacks;
using NP.API.Endpoints.Notifications;
using NP.API.Endpoints.NutritionPlans;
using NP.API.Endpoints.Nutritionists;
using NP.API.Endpoints.Posts;
using NP.API.Endpoints.Subscriptions;
using NP.API.Endpoints.Users;
using NP.API.Endpoints.Payments;

namespace NP.API.Extensions;

public static class EndpointExtensions
{
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapGroup("/auth").WithOpenApi().MapAuthEndpoints().WithTags("Auth");
        api.MapGroup("/users").WithOpenApi().MapUserEndpoints().WithTags("Users");
        api.MapGroup("/clients").WithOpenApi().MapClientEndpoints().WithTags("Clients");
        api.MapGroup("/nutritionists").WithOpenApi().MapNutritionistEndpoints().WithTags("Nutritionists");
        api.MapGroup("/appointments").WithOpenApi().MapAppointmentEndpoints().WithTags("Appointments");
        api.MapGroup("/nutrition-plans").WithOpenApi().MapNutritionPlanEndpoints().WithTags("NutritionPlans");
        api.MapGroup("/posts").WithOpenApi().MapPostEndpoints().WithTags("Posts");
        api.MapGroup("/subscriptions").WithOpenApi().MapSubscriptionEndpoints().WithTags("Subscriptions");
        api.MapGroup("/payments").WithOpenApi().MapPaymentEndpoints().WithTags("Payments");
        api.MapGroup("/notifications").WithOpenApi().MapNotificationEndpoints().WithTags("Notifications");
        api.MapGroup("/feedbacks").WithOpenApi().MapFeedbackEndpoints().WithTags("Feedbacks");
        api.MapGroup("/ai").WithOpenApi().MapAIEndpoints().WithTags("AI");

        return app;
    }
}
