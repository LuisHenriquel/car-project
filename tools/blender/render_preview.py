"""
Renderiza imagens de conferência de um carro (.blend ou .glb) em estúdio.

    python tools/blender/render_preview.py hatch.blend saida_prefixo [largura]

Gera saida_prefixo_frente.png, saida_prefixo_traseira.png e saida_prefixo_lado.png.
"""

import math
import sys

import bpy
from mathutils import Vector


def setup_studio() -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = bpy.data.worlds.new("studio")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.32, 0.34, 0.37, 1)
    bg.inputs["Strength"].default_value = 0.6

    # chão
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    floor = bpy.context.active_object
    mat = bpy.data.materials.new("floor")
    mat.use_nodes = True
    p = mat.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (0.11, 0.12, 0.13, 1)
    p.inputs["Roughness"].default_value = 0.45
    floor.data.materials.append(mat)

    # luzes de estúdio: grande softbox em cima + laterais
    def area(name, loc, rot, size, energy):
        bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot)
        light = bpy.context.active_object
        light.name = name
        light.data.size = size
        light.data.energy = energy

    area("top", (0, 0, 6), (0, 0, 0), 6, 1800)
    area("key", (5, -5, 3.5), (math.radians(60), 0, math.radians(45)), 4, 1500)
    area("rim", (-6, 4, 3), (math.radians(65), 0, math.radians(-130)), 4, 1100)


def look_at(cam, target):
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render(prefix: str, width: int) -> None:
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = int(width * 9 / 16)
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.data.lens = 50
    scene.camera = cam
    views = {
        "frente": (6.2, -5.0, 2.0),
        "traseira": (-6.0, -4.6, 2.3),
        "lado": (0.0, -8.5, 1.2),
    }
    for name, loc in views.items():
        cam.location = loc
        look_at(cam, (0, 0, 0.7))
        scene.render.filepath = f"{prefix}_{name}.png"
        bpy.ops.render.render(write_still=True)


def main(argv):
    src, prefix = argv[0], argv[1]
    width = int(argv[2]) if len(argv) > 2 else 1280
    if src.endswith(".glb"):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=src)
    else:
        bpy.ops.wm.open_mainfile(filepath=src)
    setup_studio()
    render(prefix, width)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(args)
