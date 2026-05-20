using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Clients;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Goal).HasMaxLength(500);
        builder.Property(c => c.ActivityLevel).HasMaxLength(50);
        builder.Property(c => c.Gender).HasMaxLength(20);
        builder.Property(c => c.Weight).HasColumnType("decimal(5,2)");
        builder.Property(c => c.Height).HasColumnType("decimal(5,2)");
    }
}
