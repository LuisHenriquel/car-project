using CarProject.Api.Contracts;
using CarProject.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CarProject.Api.Controllers;

/// <summary>Catálogo de carros. Por enquanto só leitura; os carros entram pelo SeedData.</summary>
[ApiController]
[Route("api/vehicles")]
public class VehiclesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<VehicleDto>> List(CancellationToken ct)
    {
        var vehicles = await db.Vehicles
            .AsNoTracking()
            .Where(v => v.IsActive)
            .OrderBy(v => v.Name)
            .ToListAsync(ct);

        return vehicles.Select(VehicleDto.From).ToList();
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<VehicleDto>> Get(string slug, CancellationToken ct)
    {
        var vehicle = await db.Vehicles.AsNoTracking().FirstOrDefaultAsync(v => v.Slug == slug, ct);
        return vehicle is null ? NotFound() : VehicleDto.From(vehicle);
    }
}
