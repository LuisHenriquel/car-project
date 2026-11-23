namespace CarProject.Api.Domain;

/// <summary>
/// Um projeto montado por alguém: o carro escolhido + as modificações.
/// </summary>
public class Project
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    /// <summary>Configuração visual, guardada como JSONB no PostgreSQL.</summary>
    public required ProjectConfig Config { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>
/// Tudo que o usuário mexe no configurador. Fica em uma coluna JSONB para podermos
/// adicionar opções novas sem criar uma coluna para cada uma.
/// </summary>
public class ProjectConfig
{
    public string PaintColor { get; set; } = "#b3121b";
    public string PaintFinish { get; set; } = "metallic";
    public string WheelStyle { get; set; } = "five-spoke";
    public string RimColor { get; set; } = "silver";
    public int RimInches { get; set; } = 16;
    public string CaliperColor { get; set; } = "#555a60";

    /// <summary>Altura da suspensão em mm (negativo = rebaixado).</summary>
    public int RideHeightMm { get; set; }

    public double CamberDeg { get; set; }

    /// <summary>Quanto a roda sai para fora, em mm.</summary>
    public int TrackMm { get; set; }

    /// <summary>Escurecimento do insulfilm, de 0 a 100.</summary>
    public int WindowTint { get; set; } = 50;
}
