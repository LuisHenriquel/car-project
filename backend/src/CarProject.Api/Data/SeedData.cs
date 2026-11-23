using CarProject.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace CarProject.Api.Data;

/// <summary>
/// Carros iniciais do catálogo.
///
/// Para adicionar um carro novo:
///  1. Siga o padrão de docs/modelos-3d.md e gere o arquivo .glb
///  2. Coloque o arquivo em frontend/public/models/ (ou, no futuro, no S3)
///  3. Adicione uma entrada aqui com o ModelUrl apontando para ele (ex.: "/models/onix-2020.glb")
///
/// ModelUrl nulo = o frontend desenha o carro simples (placeholder) da carroceria.
/// </summary>
public static class SeedData
{
    /// <summary>Cria instâncias novas a cada chamada (o EF altera os objetos ao salvar).</summary>
    public static Vehicle[] CreateVehicles() =>
    [
        new()
        {
            Slug = "hatch-generico",
            Name = "Hatch genérico",
            BodyType = BodyType.Hatch,
            ModelUrl = null,
            Specs = new VehicleSpecs
            {
                LengthMm = 3880, WidthMm = 1720, WheelbaseMm = 2520, FrontAxleOffsetMm = 1220,
                WheelCenterHeightMm = 310, ArchRadiusMm = 370, GroundClearanceMm = 165, StockRimInches = 15,
            },
        },
        new()
        {
            Slug = "seda-generico",
            Name = "Sedã genérico",
            BodyType = BodyType.Sedan,
            ModelUrl = null,
            Specs = new VehicleSpecs
            {
                LengthMm = 4360, WidthMm = 1760, WheelbaseMm = 2680, FrontAxleOffsetMm = 1320,
                WheelCenterHeightMm = 310, ArchRadiusMm = 370, GroundClearanceMm = 155, StockRimInches = 16,
            },
        },
        new()
        {
            Slug = "picape-generica",
            Name = "Picape genérica",
            BodyType = BodyType.Pickup,
            ModelUrl = null,
            Specs = new VehicleSpecs
            {
                LengthMm = 4500, WidthMm = 1800, WheelbaseMm = 2840, FrontAxleOffsetMm = 1420,
                WheelCenterHeightMm = 310, ArchRadiusMm = 370, GroundClearanceMm = 205, StockRimInches = 15,
            },
        },

        // Exemplo de carro carregado de um .glb no padrão. Pode remover quando entrarem os modelos de verdade.
        new()
        {
            Slug = "exemplo-hatch-glb",
            Name = "Exemplo de modelo .glb",
            BodyType = BodyType.Hatch,
            ModelUrl = "/models/exemplo-hatch.glb",
            Specs = new VehicleSpecs
            {
                LengthMm = 3880, WidthMm = 1720, WheelbaseMm = 2520, FrontAxleOffsetMm = 1220,
                WheelCenterHeightMm = 310, ArchRadiusMm = 370, GroundClearanceMm = 165, StockRimInches = 15,
            },
        },
    ];

    /// <summary>Insere os carros que ainda não existem no banco (pelo Slug).</summary>
    public static async Task EnsureSeededAsync(AppDbContext db, CancellationToken ct = default)
    {
        var existing = await db.Vehicles.Select(v => v.Slug).ToListAsync(ct);
        var missing = CreateVehicles().Where(v => !existing.Contains(v.Slug)).ToList();
        if (missing.Count == 0) return;

        db.Vehicles.AddRange(missing);
        await db.SaveChangesAsync(ct);
    }
}
