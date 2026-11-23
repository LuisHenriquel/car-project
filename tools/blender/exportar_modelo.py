"""
Confere e exporta um carro do Blender no padrão do Car Project (docs/modelos-3d.md).

Uso (pelo terminal):
    blender meu-carro.blend --background --python tools/blender/exportar_modelo.py -- frontend/public/models/meu-carro.glb

Ou abra o arquivo no Blender, vá em Scripting, abra este script, ajuste SAIDA lá embaixo e clique em Run.

O que ele faz:
  1. Confere se existem os objetos "body", "wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"
  2. Confere se existe o material "paint" (e avisa se faltar "glass")
  3. Confere a escala da cena (1 unidade = 1 metro) e se o carro está no chão
  4. Exporta em .glb com Y para cima (padrão do glTF)

Eixos no Blender (o exportador converte para o glTF sozinho):
  frente do carro = +X | lado direito = -Y | cima = +Z
"""

import sys

import bpy
from mathutils import Vector

BODY = "body"
WHEELS = {
    "wheel_fl": (1, 1),    # dianteira esquerda: +X, +Y no Blender
    "wheel_fr": (1, -1),   # dianteira direita:  +X, -Y no Blender
    "wheel_rl": (-1, 1),   # traseira esquerda:  -X, +Y no Blender
    "wheel_rr": (-1, -1),  # traseira direita:   -X, -Y no Blender
}

# Caminho de saída padrão se rodar pela aba Scripting
SAIDA = "//modelo.glb"


def output_path() -> str:
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        if args:
            return args[0]
    return bpy.path.abspath(SAIDA)


def check() -> list[str]:
    errors: list[str] = []
    warnings: list[str] = []
    objects = bpy.data.objects

    if BODY not in objects:
        errors.append(f'Falta o objeto "{BODY}" (agrupe a carroceria dentro dele).')

    for name, (sx, sy) in WHEELS.items():
        obj = objects.get(name)
        if obj is None:
            errors.append(f'Falta o objeto "{name}" no centro da roda.')
            continue
        p = obj.matrix_world.translation
        if (p.x > 0) != (sx > 0) or (p.y > 0) != (sy > 0):
            errors.append(f'"{name}" está no lugar errado ({p.x:.2f}, {p.y:.2f}). Frente = +X, direita = -Y.')
        if not 0.2 <= p.z <= 0.5:
            warnings.append(f'"{name}" está a {p.z:.2f} m do chão (esperado ~0,30 m no centro da roda).')

    materials = {m.name for m in bpy.data.materials}
    if "paint" not in materials:
        errors.append('Falta o material "paint" (a pintura do carro).')
    if "glass" not in materials:
        warnings.append('Falta o material "glass" (o insulfilm não vai funcionar).')

    scene = bpy.context.scene
    if abs(scene.unit_settings.scale_length - 1.0) > 1e-6:
        errors.append("A escala da cena precisa ser 1.0 (1 unidade = 1 metro).")

    # Ponto mais baixo do carro deve estar em z = 0
    lowest = min(
        (
            (obj.matrix_world @ Vector(corner)).z
            for obj in bpy.context.scene.objects
            if obj.type == "MESH"
            for corner in obj.bound_box
        ),
        default=0.0,
    )
    if abs(lowest) > 0.05:
        errors.append(f"O ponto mais baixo está em z={lowest:.2f} m; os pneus devem tocar o chão em z=0.")

    for w in warnings:
        print(f"  ⚠ {w}")
    for e in errors:
        print(f"  ✖ {e}")
    return errors


def export(path: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        use_selection=False,
    )
    print(f"\nExportado: {path}")
    print("Agora rode: npm run validate-model -- " + path + "  (dentro de frontend/)")


if __name__ == "__main__":
    print("\nCar Project: conferindo o modelo...\n")
    problems = check()
    if problems:
        print(f"\n{len(problems)} erro(s). Corrija e rode de novo.")
        sys.exit(1)
    export(output_path())
