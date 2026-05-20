using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Nutritionists;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class NutritionistConfiguration : IEntityTypeConfiguration<Nutritionist>
{
    public void Configure(EntityTypeBuilder<Nutritionist> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Bio).HasMaxLength(1000);
        builder.Property(n => n.Specialization).HasMaxLength(200);
        builder.Property(n => n.CertificateUrl).HasMaxLength(500);
    }
}
