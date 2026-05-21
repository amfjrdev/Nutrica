using Microsoft.EntityFrameworkCore;
using NP.API.Extensions;
using NP.API.Hubs;
using NP.API.Middleware;
using NP.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationServices(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapEndpoints();
app.MapHub<ChatHub>("/hubs/chat", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets;
});
app.MapHub<VideoHub>("/hubs/video", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets;
});
app.MapHub<NotificationHub>("/hubs/notifications", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets;
});
app.MapHealthChecks("/health");

// Temporary debug endpoint — remove after fixing email
app.MapGet("/debug/email-config", (IConfiguration config) => new {
    SmtpHost    = config["Email:SmtpHost"],
    SmtpPort    = config["Email:SmtpPort"],
    Username    = config["Email:Username"],
    Password    = config["Email:Password"]?[..10] + "...",
    FromAddress = config["Email:FromAddress"],
});
if (app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "NP API v1"));
}

app.Run();
