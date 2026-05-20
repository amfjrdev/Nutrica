using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentSlotUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Appointments_NutritionistId_ScheduledAt_Active",
                table: "Appointments",
                columns: new[] { "NutritionistId", "ScheduledAt" },
                unique: true,
                filter: "[Status] IN ('Pending','Approved')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_NutritionistId_ScheduledAt_Active",
                table: "Appointments");
        }
    }
}
