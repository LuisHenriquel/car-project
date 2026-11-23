using CarProject.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace CarProject.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Vehicle>(e =>
        {
            e.ToTable("vehicles");
            e.HasIndex(v => v.Slug).IsUnique();
            e.Property(v => v.Slug).HasMaxLength(80);
            e.Property(v => v.Name).HasMaxLength(120);
            e.Property(v => v.Brand).HasMaxLength(60);
            e.Property(v => v.ModelUrl).HasMaxLength(500);
            e.Property(v => v.BodyType).HasConversion<string>().HasMaxLength(20);

            // As medidas ficam em colunas da própria tabela (specs_length_mm, ...).
            e.OwnsOne(v => v.Specs);
        });

        model.Entity<Project>(e =>
        {
            e.ToTable("projects");
            e.Property(p => p.Name).HasMaxLength(120);
            e.HasOne(p => p.Vehicle)
                .WithMany(v => v.Projects)
                .HasForeignKey(p => p.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração do projeto em uma coluna JSONB.
            e.OwnsOne(p => p.Config, c => c.ToJson());
        });
    }
}
