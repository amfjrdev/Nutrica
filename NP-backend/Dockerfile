# ── Build stage ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore — separate layer so it's cached unless .csproj files change
COPY ["src/NP.API/NP.API.csproj",             "src/NP.API/"]
COPY ["src/NP.Application/NP.Application.csproj", "src/NP.Application/"]
COPY ["src/NP.Domain/NP.Domain.csproj",        "src/NP.Domain/"]
COPY ["src/NP.Infrastructure/NP.Infrastructure.csproj", "src/NP.Infrastructure/"]

RUN dotnet restore "src/NP.API/NP.API.csproj"

# Copy everything and publish
COPY . .
RUN dotnet publish "src/NP.API/NP.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for the Docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

# Limit .NET GC memory to fit in 512MB free tier
ENV DOTNET_GCHeapHardLimit=400000000
ENV DOTNET_GCConserveMemory=9
ENV DOTNET_TieredCompilation=0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "NP.API.dll"]
