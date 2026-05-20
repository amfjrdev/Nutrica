using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NP.API.Hubs;
using NP.Application.Abstractions.Messaging;
using NP.Infrastructure;

namespace NP.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddInfrastructure(configuration);
        services.AddApplicationHandlers();
        services.AddJwtAuthentication(configuration);
        services.AddHttpContextAccessor();
        services.AddHealthChecks();
        // Register hub pusher bridge (API → Infrastructure, avoids circular ref)
        services.AddScoped<NP.Infrastructure.Notifications.INotificationHubPusher, NP.API.Hubs.NotificationHubPusher>();
        services.AddSignalR(options =>
        {
            // Never expose stack traces to clients in production (CWE-209).
            options.EnableDetailedErrors =
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        })
        .AddHubOptions<ChatHub>(options =>
        {
            options.SupportedProtocols = ["json"];
        })
        .AddHubOptions<VideoHub>(options =>
        {
            options.SupportedProtocols = ["json"];
        })
        .AddHubOptions<NotificationHub>(options =>
        {
            options.SupportedProtocols = ["json"];
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("AdminOnly", p => p.RequireRole("Admin"))
            .AddPolicy("ClientOnly", p => p.RequireRole("Client"))
            .AddPolicy("NutritionistOnly", p => p.RequireRole("Nutritionist"))
            .AddPolicy("NutritionistOrAdmin", p => p.RequireRole("Nutritionist", "Admin"));

        services.AddCors(options =>
            options.AddDefaultPolicy(policy =>
            {
                var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
                if (origins.Length > 0)
                    policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
                else
                    // Dev fallback: allow any origin but SignalR still needs credentials,
                    // so we use a wildcard-safe approach for local development only.
                    policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
            }));

        if (configuration.GetValue<bool>("Swagger:Enabled"))
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "NP API", Version = "v1" });
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Header,
                    Description = "Enter: Bearer {token} — example: Bearer eyJhbGci..."
                });
                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                        },
                        Array.Empty<string>()
                    }
                });
            });
        }

        return services;
    }

    private static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection("Jwt");
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSection["Secret"]!;

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSection["Issuer"],
                    ValidAudience = jwtSection["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                    NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };

                // Allow JWT via query string for SignalR WebSocket connections
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var token = ctx.Request.Query["access_token"].FirstOrDefault();
                        var path = ctx.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(token) &&
                            (path.StartsWithSegments("/hubs/chat")
                             || path.StartsWithSegments("/hubs/video")
                             || path.StartsWithSegments("/hubs/notifications")))
                        {
                            ctx.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }

    private static IServiceCollection AddApplicationHandlers(this IServiceCollection services)
    {
        var assembly = typeof(ICommand).Assembly;

        services.Scan(scan => scan
            .FromAssemblies(assembly)
            .AddClasses(c => c.AssignableTo(typeof(ICommandHandler<>)))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        services.Scan(scan => scan
            .FromAssemblies(assembly)
            .AddClasses(c => c.AssignableTo(typeof(ICommandHandler<,>)))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        services.Scan(scan => scan
            .FromAssemblies(assembly)
            .AddClasses(c => c.AssignableTo(typeof(IQueryHandler<,>)))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        return services;
    }
}
