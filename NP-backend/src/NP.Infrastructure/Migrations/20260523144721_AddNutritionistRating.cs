using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNutritionistRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NutritionistRatings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NutritionistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionistRatings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NutritionistRatings_ClientId_NutritionistId",
                table: "NutritionistRatings",
                columns: new[] { "ClientId", "NutritionistId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NutritionistRatings");
        }
    }
}
