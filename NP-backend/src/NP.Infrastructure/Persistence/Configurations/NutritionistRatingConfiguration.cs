using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Feedbacks;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class NutritionistRatingConfiguration : IEntityTypeConfiguration<NutritionistRating>
{
    public void Configure(EntityTypeBuilder<NutritionistRating> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Comment).HasMaxLength(1000);
        builder.Property(r => r.Rating).IsRequired();
        builder.HasIndex(r => new { r.ClientId, r.NutritionistId }).IsUnique();
    }
}
