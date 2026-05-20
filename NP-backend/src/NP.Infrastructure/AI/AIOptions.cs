namespace NP.Infrastructure.AI;

public sealed class AIOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "llama-3.3-70b-versatile";
}
