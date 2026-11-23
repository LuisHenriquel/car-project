using System.ComponentModel.DataAnnotations;
using CarProject.Api.Domain;

namespace CarProject.Api.Contracts;

public record ProjectConfigDto
{
    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")]
    public string PaintColor { get; init; } = "#b3121b";

    [Required, AllowedValues("solid", "metallic", "pearl", "matte")]
    public string PaintFinish { get; init; } = "metallic";

    [Required, AllowedValues("five-spoke", "multi-spoke", "mesh", "dish")]
    public string WheelStyle { get; init; } = "five-spoke";

    [Required, AllowedValues("silver", "graphite", "black", "bronze", "gold", "white")]
    public string RimColor { get; init; } = "silver";

    [Range(13, 22)]
    public int RimInches { get; init; } = 16;

    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")]
    public string CaliperColor { get; init; } = "#555a60";

    [Range(-120, 120)]
    public int RideHeightMm { get; init; }

    [Range(0, 15)]
    public double CamberDeg { get; init; }

    [Range(-30, 60)]
    public int TrackMm { get; init; }

    [Range(0, 100)]
    public int WindowTint { get; init; } = 50;

    public ProjectConfig ToEntity() => new()
    {
        PaintColor = PaintColor,
        PaintFinish = PaintFinish,
        WheelStyle = WheelStyle,
        RimColor = RimColor,
        RimInches = RimInches,
        CaliperColor = CaliperColor,
        RideHeightMm = RideHeightMm,
        CamberDeg = CamberDeg,
        TrackMm = TrackMm,
        WindowTint = WindowTint,
    };

    public static ProjectConfigDto From(ProjectConfig c) => new()
    {
        PaintColor = c.PaintColor,
        PaintFinish = c.PaintFinish,
        WheelStyle = c.WheelStyle,
        RimColor = c.RimColor,
        RimInches = c.RimInches,
        CaliperColor = c.CaliperColor,
        RideHeightMm = c.RideHeightMm,
        CamberDeg = c.CamberDeg,
        TrackMm = c.TrackMm,
        WindowTint = c.WindowTint,
    };
}

public record SaveProjectRequest
{
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = "";

    [Required, StringLength(80)]
    public string VehicleSlug { get; init; } = "";

    [Required]
    public ProjectConfigDto Config { get; init; } = new();
}

public record ProjectDto(
    Guid Id,
    string Name,
    string VehicleSlug,
    ProjectConfigDto Config,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static ProjectDto From(Project p) => new(
        p.Id,
        p.Name,
        p.Vehicle?.Slug ?? "",
        ProjectConfigDto.From(p.Config),
        p.CreatedAt,
        p.UpdatedAt);
}
