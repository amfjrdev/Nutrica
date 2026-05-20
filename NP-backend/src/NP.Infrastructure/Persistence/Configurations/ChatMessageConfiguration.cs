using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Chat;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.SenderUserId).IsRequired().HasMaxLength(100);
        builder.Property(m => m.SenderRole).IsRequired().HasMaxLength(50);
        builder.Property(m => m.Message).IsRequired().HasMaxLength(4000);

        // Composite index: fast lookup of all messages for an appointment in time order.
        builder.HasIndex(m => new { m.AppointmentId, m.SentAt });
    }
}
