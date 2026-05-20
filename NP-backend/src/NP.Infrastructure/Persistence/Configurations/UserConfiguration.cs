using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Users;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(50);
        builder.Property(u => u.PhoneNumber).HasMaxLength(20);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).IsRequired().HasMaxLength(20);
        builder.HasIndex(u => u.Email).IsUnique();

        // OTP columns — nullable, only populated during active 2FA flow
        builder.Property(u => u.OtpHash).HasMaxLength(100);
        builder.Property(u => u.OtpExpiry);
        builder.Property(u => u.OtpAttempts).HasDefaultValue(0);
        builder.Property(u => u.OtpLastSentAt);
    }
}
