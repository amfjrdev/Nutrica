using Microsoft.EntityFrameworkCore;
using NP.Domain.Admins;
using NP.Domain.Appointments;
using NP.Domain.Chat;
using NP.Domain.Clients;
using NP.Domain.Feedbacks;
using NP.Domain.Notifications;
using NP.Domain.NutritionPlans;
using NP.Domain.Nutritionists;
using NP.Domain.Payments;
using NP.Domain.Posts;
using NP.Domain.Subscriptions;
using NP.Domain.Users;

namespace NP.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Nutritionist> Nutritionists => Set<Nutritionist>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<NutritionPlan> NutritionPlans => Set<NutritionPlan>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
