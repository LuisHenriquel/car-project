using CarProject.Api.Domain;

namespace CarProject.Api.Contracts;

public record VehicleSpecsDto(
    int LengthMm,
    int WidthMm,
    int WheelbaseMm,
    int FrontAxleOffsetMm,
    int WheelCenterHeightMm,
    int ArchRadiusMm,
    int GroundClearanceMm,
    int StockRimInches);

public record VehicleDto(
    int Id,
    string Slug,
    string Name,
    string? Brand,
    string BodyType,
    string? ModelUrl,
    VehicleSpecsDto Specs)
{
    public static VehicleDto From(Vehicle v) => new(
        v.Id,
        v.Slug,
        v.Name,
        v.Brand,
        ToApi(v.BodyType),
        v.ModelUrl,
        new VehicleSpecsDto(
            v.Specs.LengthMm,
            v.Specs.WidthMm,
            v.Specs.WheelbaseMm,
            v.Specs.FrontAxleOffsetMm,
            v.Specs.WheelCenterHeightMm,
            v.Specs.ArchRadiusMm,
            v.Specs.GroundClearanceMm,
            v.Specs.StockRimInches));

    /// <summary>Nome da carroceria como o frontend espera ("hatch", "sedan", "pickup").</summary>
    public static string ToApi(BodyType type) => type.ToString().ToLowerInvariant();
}
