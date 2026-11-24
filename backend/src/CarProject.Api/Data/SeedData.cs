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
            ModelUrl = "/models/hatch-generico.glb", // gerado por tools/blender/gerar_carro.py
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
    ];

    /// <summary>
    /// Insere os carros que ainda não existem (pelo Slug) e atualiza os que já existem
    /// (nome, modelo 3D e medidas), para o banco acompanhar o que está aqui.
    /// </summary>
    public static async Task EnsureSeededAsync(AppDbContext db, CancellationToken ct = default)
    {
        var existing = await db.Vehicles.ToListAsync(ct);
        foreach (var seed in CreateVehicles())
        {
            var vehicle = existing.FirstOrDefault(v => v.Slug == seed.Slug);
            if (vehicle is null)
            {
                db.Vehicles.Add(seed);
                continue;
            }
            vehicle.Name = seed.Name;
            vehicle.Brand = seed.Brand;
            vehicle.BodyType = seed.BodyType;
            vehicle.ModelUrl = seed.ModelUrl;
            vehicle.Specs = seed.Specs;
        }
        await db.SaveChangesAsync(ct);
    }
}
