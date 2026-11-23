using CarProject.Api.Contracts;
using CarProject.Api.Data;
using CarProject.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace CarProject.Api.Controllers;

/// <summary>
/// Projetos salvos. Ainda não há login: qualquer pessoa com o id do projeto consegue abrir.
/// Quando entrar autenticação, os projetos passam a ter dono.
/// </summary>
[ApiController]
[Route("api/projects")]
public class ProjectsController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> Get(Guid id, CancellationToken ct)
    {
        var project = await db.Projects
            .AsNoTracking()
            .Include(p => p.Vehicle)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return project is null ? NotFound() : ProjectDto.From(project);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create(SaveProjectRequest request, CancellationToken ct)
    {
        var vehicle = await db.Vehicles.FirstOrDefaultAsync(v => v.Slug == request.VehicleSlug, ct);
        if (vehicle is null)
            return ValidationProblem(FieldError("Carro não encontrado", nameof(request.VehicleSlug)));

        var now = clock.GetUtcNow();
        var project = new Project
        {
            Id = Guid.CreateVersion7(),
            Name = request.Name.Trim(),
            Vehicle = vehicle,
            Config = request.Config.ToEntity(),
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = project.Id }, ProjectDto.From(project));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, SaveProjectRequest request, CancellationToken ct)
    {
        var project = await db.Projects.Include(p => p.Vehicle).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null) return NotFound();

        if (project.Vehicle?.Slug != request.VehicleSlug)
        {
            var vehicle = await db.Vehicles.FirstOrDefaultAsync(v => v.Slug == request.VehicleSlug, ct);
            if (vehicle is null)
                return ValidationProblem(FieldError("Carro não encontrado", nameof(request.VehicleSlug)));
            project.Vehicle = vehicle;
        }

        project.Name = request.Name.Trim();
        project.Config = request.Config.ToEntity();
        project.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return ProjectDto.From(project);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await db.Projects.Where(p => p.Id == id).ExecuteDeleteAsync(ct);
        return deleted == 0 ? NotFound() : NoContent();
    }

    private static ModelStateDictionary FieldError(string message, string field)
    {
        var state = new ModelStateDictionary();
        state.AddModelError(field, message);
        return state;
    }
}
