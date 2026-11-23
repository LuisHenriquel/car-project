namespace CarProject.Api.Domain;

/// <summary>
/// Um carro do catálogo (ex.: "Hatch genérico", e no futuro "Onix 2020 LT").
/// </summary>
public class Vehicle
{
    public int Id { get; set; }

    /// <summary>Identificador usado na URL e no frontend (ex.: "hatch-generico").</summary>
    public required string Slug { get; set; }

    public required string Name { get; set; }

    /// <summary>Marca. Nulo para os modelos genéricos.</summary>
    public string? Brand { get; set; }

    public BodyType BodyType { get; set; }

    /// <summary>
    /// Caminho ou URL do arquivo .glb no padrão do Car Project (ver docs/modelos-3d.md).
    /// Nulo = o frontend desenha o carro simples (placeholder) da carroceria.
    /// </summary>
    public string? ModelUrl { get; set; }

    /// <summary>Medidas usadas no 3D e nos avisos de encaixe.</summary>
    public required VehicleSpecs Specs { get; set; }

    public bool IsActive { get; set; } = true;

    public List<Project> Projects { get; set; } = [];
}

public enum BodyType
{
    Hatch,
    Sedan,
    Pickup,
}

/// <summary>Medidas em milímetros.</summary>
public class VehicleSpecs
{
    public int LengthMm { get; set; }
    public int WidthMm { get; set; }
    public int WheelbaseMm { get; set; }

    /// <summary>Distância do eixo dianteiro até o centro do carro (positivo = para frente).</summary>
    public int FrontAxleOffsetMm { get; set; }

    /// <summary>Altura do centro da roda com a suspensão original.</summary>
    public int WheelCenterHeightMm { get; set; }

    /// <summary>Raio da caixa de roda (para-lama).</summary>
    public int ArchRadiusMm { get; set; }

    /// <summary>Vão livre original (ponto mais baixo da carroceria até o chão).</summary>
    public int GroundClearanceMm { get; set; }

    /// <summary>Aro original de fábrica.</summary>
    public int StockRimInches { get; set; }
}
