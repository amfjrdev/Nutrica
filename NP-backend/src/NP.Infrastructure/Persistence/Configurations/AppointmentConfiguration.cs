using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NP.Domain.Appointments;

namespace NP.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.Property(a => a.RejectionReason).HasMaxLength(500);

        // ── Concurrency fix ───────────────────────────────────────────────────
        // IsSlotTakenAsync + AddAsync are two separate DB round-trips, so two
        // requests that arrive at the same millisecond can both pass the check
        // and both insert — a classic TOCTOU race condition.
        //
        // This filtered unique index is the ONLY reliable fix: the database
        // itself rejects the second insert with a unique-constraint violation,
        // regardless of how many app instances are running.
        //
        // The index covers only Pending and Approved rows, so Rejected /
        // Cancelled / Attended appointments for the same slot are allowed
        // (the slot is free again after a rejection or cancellation).
        //
        // NOTE: after adding this index you must create a new EF migration:
        //   dotnet ef migrations add AddAppointmentSlotUniqueIndex
        //   dotnet ef database update
        // ─────────────────────────────────────────────────────────────────────
        builder.HasIndex(a => new { a.NutritionistId, a.ScheduledAt })
               .HasFilter("[Status] IN ('Pending','Approved')")
               .IsUnique()
               .HasDatabaseName("IX_Appointments_NutritionistId_ScheduledAt_Active");
    }
}
