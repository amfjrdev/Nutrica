using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NP.Application.Abstractions.AI;
using NP.Application.Abstractions.Authentication;
using NP.Application.Abstractions.Email;
using NP.Application.Abstractions.Notifications;
using NP.Application.Abstractions.Stripe;
using NP.Application.Notifications;
using NP.Domain.Admins.Repositories;
using NP.Domain.Appointments.Repositories;
using NP.Domain.Chat;
using NP.Domain.Clients.Repositories;
using NP.Domain.Feedbacks.Repositories;
using NP.Domain.Notifications.Repositories;
using NP.Domain.NutritionPlans.Repositories;
using NP.Domain.Nutritionists.Repositories;
using NP.Domain.Payments.Repositories;
using NP.Domain.Posts.Repositories;
using NP.Domain.Subscriptions.Repositories;
using NP.Domain.Users.Repositories;
using NP.Infrastructure.AI;
using NP.Infrastructure.Authentication;
using NP.Infrastructure.Email;
using NP.Infrastructure.Persistence;
using NP.Infrastructure.Persistence.Repositories;

namespace NP.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null)));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<INutritionistRepository, NutritionistRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<INutritionPlanRepository, NutritionPlanRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IFeedbackRepository, FeedbackRepository>();

        // Chat
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();

        // Notifications
        services.AddScoped<INotificationService, NP.Infrastructure.Notifications.NotificationService>();
        services.AddScoped<NotificationDispatcher>();

        // Authentication services
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddHttpContextAccessor();
        services.AddScoped<IUserContext, UserContext>();

        // Email (2FA OTP delivery)
        services.Configure<EmailOptions>(configuration.GetSection("Email"));
        services.AddHttpClient("brevo");
        services.AddScoped<IEmailService, EmailService>();

        // Stripe
        services.Configure<NP.Infrastructure.Stripe.StripeOptions>(configuration.GetSection("Stripe"));
        services.AddScoped<IStripeService, NP.Infrastructure.Stripe.StripeService>();

        // AI
        services.Configure<AIOptions>(configuration.GetSection("AI"));
        services.AddHttpClient("hf-calorie").ConfigureHttpClient(c =>
            c.Timeout = TimeSpan.FromSeconds(60));
        services.AddScoped<IAIService, AIService>();

        return services;
    }
}
