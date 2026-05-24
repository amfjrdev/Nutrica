using NP.Domain.Abstractions;

namespace NP.Domain.CalorieScans;

public sealed class CalorieScan : Entity
{
    private CalorieScan() { }

    private CalorieScan(Guid id, Guid clientId, string foodName, int estimatedCalories,
        double totalFat, double totalCarbs, double totalProtein, int itemsDetected,
        string details, string originalImageBase64, string? segmentedImageBase64, string foodsJson)
        : base(id)
    {
        ClientId = clientId;
        FoodName = foodName;
        EstimatedCalories = estimatedCalories;
        TotalFat = totalFat;
        TotalCarbs = totalCarbs;
        TotalProtein = totalProtein;
        ItemsDetected = itemsDetected;
        Details = details;
        OriginalImageBase64 = originalImageBase64;
        SegmentedImageBase64 = segmentedImageBase64;
        FoodsJson = foodsJson;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid ClientId { get; private set; }
    public string FoodName { get; private set; }
    public int EstimatedCalories { get; set; }
    public double TotalFat { get; set; }
    public double TotalCarbs { get; set; }
    public double TotalProtein { get; set; }
    public int ItemsDetected { get; private set; }
    public string Details { get; private set; }
    public string OriginalImageBase64 { get; private set; }
    public string? SegmentedImageBase64 { get; private set; }
    public string FoodsJson { get; set; }
    public DateTime CreatedAt { get; private set; }

    public static CalorieScan Create(Guid clientId, string foodName, int estimatedCalories,
        double totalFat, double totalCarbs, double totalProtein, int itemsDetected,
        string details, string originalImageBase64, string? segmentedImageBase64, string foodsJson)
    {
        return new CalorieScan(Guid.NewGuid(), clientId, foodName, estimatedCalories,
            totalFat, totalCarbs, totalProtein, itemsDetected,
            details, originalImageBase64, segmentedImageBase64, foodsJson);
    }
}
