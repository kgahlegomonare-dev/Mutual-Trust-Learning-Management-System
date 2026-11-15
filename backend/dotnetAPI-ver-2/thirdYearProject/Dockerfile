# Stage 1: Build & Publish (SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy all .csproj files for Clean Architecture layers to cache dependency restore
COPY ["TYP.api/TYP.api.csproj", "TYP.api/"]
COPY ["TYP.Infrastructure/TYP.Infrastructure.csproj", "TYP.Infrastructure/"]
COPY ["TYP.Application/TYP.Application.csproj", "TYP.Application/"]
COPY ["TYP.Domain/TYP.Domain.csproj", "TYP.Domain/"]

# Restore NuGet dependencies
RUN dotnet restore "TYP.api/TYP.api.csproj"

# Copy full source code into the build image
COPY . .

# Move into the API directory and build/publish Release binaries
WORKDIR "/src/TYP.api"
RUN dotnet publish "TYP.api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

# Pre-create Upload directories inside the container for Announcements and Learning Materials
RUN mkdir -p /app/wwwroot /app/Uploads/Announcements /app/Uploads/LearningMaterials

# Expose API port
EXPOSE 7060
ENV ASPNETCORE_URLS=http://+:7060
ENV ASPNETCORE_ENVIRONMENT=Development

# Copy published binaries from stage 1
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TYP.api.dll"]