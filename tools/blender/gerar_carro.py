"""
Gera os carros genéricos do Car Project direto no Blender, já no padrão de docs/modelos-3d.md.

Uso:
    blender --background --python tools/blender/gerar_carro.py -- hatch frontend/public/models/hatch.glb
    # ou, com o Blender como módulo Python (pip install bpy):
    python tools/blender/gerar_carro.py hatch frontend/public/models/hatch.glb

Como o carro é construído:
  1. O perfil lateral (silhueta) vira um bloco extrudado na largura.
  2. O bloco é "remalhado" (voxel remesh) e deformado: estreita na frente/traseira
     (cantos arredondados vistos de cima) e para cima (teto mais estreito que a porta).
  3. Suaviza, recorta as caixas de roda e os vincos das portas.
  4. Pinta cada face pela região: vidro, lataria, plástico preto.
  5. Adiciona faróis, lanternas, grade, retrovisores, maçanetas, interior e rodas.

Eixos no Blender: frente = +X, cima = +Z, lado direito = -Y.
"""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass, field

import bpy  # noqa: I001 (bpy precisa vir antes do bmesh quando usado como módulo)
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


# ---------------------------------------------------------------------------
# Especificação de cada carroceria (metros)
# ---------------------------------------------------------------------------

@dataclass
class CarSpec:
    name: str
    length: float
    width: float
    front_axle: float
    rear_axle: float
    wheel_center: float
    arch_radius: float
    sill: float
    # Silhueta lateral: pontos (x, z) no sentido anti-horário, começando embaixo na traseira.
    # "c" no terceiro item = ponto de controle de curva (quadrática).
    profile: list
    belt: float  # linha de cintura (base das janelas)
    roof: float  # altura do teto
    roof_half_width: float  # meia largura no teto (tumblehome)
    corner_radius: float  # arredondamento dos cantos vistos de cima
    # Linhas da área envidraçada lateral: (x_frente_base, x_frente_topo, x_tras_topo, x_tras_base)
    side_glass: tuple
    b_pillar: float | None
    door_lines: list = field(default_factory=list)  # juntas verticais das portas: (x, z_inicial)
    windshield_base: float = 0.86  # x onde começa o para-brisa
    rear_glass: tuple | None = None  # (z_min, z_max) do vidro traseiro
    bed: tuple | None = None  # picape: (x_frente, x_tras, z_assoalho)
    headlight: tuple = (0.62, 0.62, 0.09)  # (z, y_centro, altura)
    taillight: tuple = (0.86, 0.6, 0.13)


HATCH = CarSpec(
    name="hatch",
    length=3.88,
    width=1.72,
    front_axle=1.22,
    rear_axle=-1.30,
    wheel_center=0.31,
    arch_radius=0.37,
    sill=0.165,
    profile=[
        (-1.80, 0.17),
        (1.80, 0.17),
        (1.93, 0.20, "c"),
        (1.95, 0.40),
        (1.96, 0.62, "c"),
        (1.78, 0.70),
        (1.30, 0.78, "c"),
        (0.86, 0.87),
        (0.40, 1.22, "c"),
        (-0.10, 1.41),
        (-0.70, 1.47, "c"),
        (-1.30, 1.43),
        (-1.62, 1.38, "c"),
        (-1.80, 1.02),
        (-1.95, 0.90, "c"),
        (-1.95, 0.62),
        (-1.96, 0.24, "c"),
    ],
    belt=0.90,
    roof=1.46,
    roof_half_width=0.64,
    corner_radius=0.48,
    side_glass=(0.74, -0.02, -1.28, -1.66),
    b_pillar=-0.42,
    door_lines=[(0.80, 0.27), (-0.43, 0.27), (-1.20, 0.71)],
    windshield_base=0.86,
    rear_glass=(1.05, 1.38),
)

SPECS = {"hatch": HATCH}


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def link(obj: bpy.types.Object, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    bpy.context.scene.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def profile_points(profile: list, steps: int = 10) -> list[tuple[float, float]]:
    """Converte a lista de pontos/controles em uma polilinha fechada."""
    pts: list[tuple[float, float]] = []
    n = len(profile)
    i = 0
    while i < n:
        p = profile[i]
        nxt = profile[(i + 1) % n]
        if len(nxt) == 3 and nxt[2] == "c":
            end = profile[(i + 2) % n]
            for s in range(steps):
                t = s / steps
                x = (1 - t) ** 2 * p[0] + 2 * (1 - t) * t * nxt[0] + t * t * end[0]
                z = (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * nxt[1] + t * t * end[1]
                pts.append((x, z))
            i += 2
        else:
            pts.append((p[0], p[1]))
            i += 1
    return pts


def extrude_profile(name: str, pts: list[tuple[float, float]], width: float) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new((x, 0.0, z)) for x, z in pts]
    face = bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    ret = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, width, 0))
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=(0, -width / 2, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    return link(bpy.data.objects.new(name, mesh))


def apply_modifier(obj: bpy.types.Object, mod: bpy.types.Modifier) -> None:
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def remesh(obj: bpy.types.Object, voxel: float) -> None:
    m = obj.modifiers.new("remesh", "REMESH")
    m.mode = "VOXEL"
    m.voxel_size = voxel
    m.adaptivity = 0.0
    apply_modifier(obj, m)


def smooth(obj: bpy.types.Object, factor: float, iterations: int) -> None:
    m = obj.modifiers.new("smooth", "SMOOTH")
    m.factor = factor
    m.iterations = iterations
    apply_modifier(obj, m)


def boolean(obj: bpy.types.Object, cutter: bpy.types.Object, op: str = "DIFFERENCE") -> None:
    m = obj.modifiers.new("bool", "BOOLEAN")
    m.operation = op
    m.object = cutter
    m.solver = "EXACT"
    apply_modifier(obj, m)
    bpy.data.objects.remove(cutter, do_unlink=True)


def material(name: str, color, metallic=0.0, roughness=0.5, alpha=1.0, emission=None, coat=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "BLENDED"
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 2.0
    return mat


def make_materials() -> dict[str, bpy.types.Material]:
    return {
        "paint": material("paint", (0.55, 0.03, 0.05), metallic=0.6, roughness=0.3, coat=1.0),
        "glass": material("glass", (0.02, 0.03, 0.04), roughness=0.05, alpha=0.75),
        "trim": material("trim", (0.02, 0.02, 0.022), roughness=0.6),
        "trim_gloss": material("trim_gloss", (0.01, 0.01, 0.012), roughness=0.15, coat=1.0),
        "chrome": material("chrome", (0.9, 0.9, 0.92), metallic=1.0, roughness=0.12),
        "headlight": material("headlight", (0.85, 0.9, 0.95), roughness=0.05, emission=(0.9, 0.95, 1.0)),
        "headlight_housing": material("headlight_housing", (0.15, 0.16, 0.18), metallic=0.8, roughness=0.25),
        "taillight": material("taillight", (0.45, 0.0, 0.01), roughness=0.1, emission=(0.8, 0.02, 0.02)),
        "interior": material("interior", (0.035, 0.035, 0.04), roughness=0.85),
        "tire": material("tire", (0.025, 0.025, 0.025), roughness=0.9),
        "rim": material("rim", (0.75, 0.76, 0.78), metallic=1.0, roughness=0.25),
        "plate": material("plate", (0.92, 0.92, 0.92), roughness=0.4),
    }


# ---------------------------------------------------------------------------
# Carroceria
# ---------------------------------------------------------------------------

def half_width(spec: CarSpec, x: float, z: float) -> float:
    """Meia largura desejada em (x, z): cantos arredondados + teto mais estreito."""
    hw = spec.width / 2
    # tumblehome: acima da cintura, estreita até o teto
    if z > spec.belt:
        t = min(1.0, (z - spec.belt) / (spec.roof - spec.belt))
        t = t ** 0.8
        hw = hw + (spec.roof_half_width - hw) * t
    # lateral com "barriga": mais larga na altura das portas e recolhida embaixo
    if z < spec.belt:
        hw *= 1.0 - 0.02 * ((z - 0.6) / 0.35) ** 2
    if z < 0.5:
        hw *= 1.0 - 0.05 * ((0.5 - z) / 0.33) ** 2
    # cantos arredondados vistos de cima
    front = spec.length / 2 + 0.02
    rear = -spec.length / 2 - 0.02
    r = spec.corner_radius
    for end, sign in ((front, 1), (rear, -1)):
        d = (x - (end - sign * r)) * sign  # distância passada do início do canto
        if d > 0:
            k = min(1.0, d / r)
            hw *= math.sqrt(max(0.0, 1 - k ** 2.2)) * 0.55 + 0.45
    return hw


def build_shell(spec: CarSpec) -> bpy.types.Object:
    pts = profile_points(spec.profile)
    body = extrude_profile("shell", pts, spec.width)
    remesh(body, 0.03)

    # Deforma a largura de cada vértice pela forma desejada
    base = spec.width / 2
    for v in body.data.vertices:
        x, y, z = v.co
        v.co.y = y / base * half_width(spec, x, z)

    remesh(body, 0.018)
    smooth(body, 0.8, 16)

    # Caixas de roda
    for ax in (spec.front_axle, spec.rear_axle):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=96, radius=spec.arch_radius, depth=spec.width * 1.4,
            location=(ax, 0, spec.wheel_center), rotation=(math.pi / 2, 0, 0),
        )
        boolean(body, bpy.context.active_object)
    # Vão por baixo (a carroceria não é um bloco maciço até o chão entre as rodas)
    return body


# ---------------------------------------------------------------------------
# Detalhes
# ---------------------------------------------------------------------------

def surface_point(tree: BVHTree, origin: Vector, direction: Vector) -> tuple[Vector, Vector] | None:
    hit = tree.ray_cast(origin, direction)
    if hit[0] is None:
        return None
    return hit[0], hit[1]


def decal(name: str, tree: BVHTree, center: Vector, direction: Vector, size: tuple[float, float],
          up: Vector, mat, thickness: float = 0.012, offset: float = 0.003, roundness: float = 0.35,
          parent=None) -> bpy.types.Object | None:
    """Placa fina (farol, lanterna, grade) colada na superfície da carroceria."""
    origin = center - direction * 1.5
    w, h = size
    right = direction.cross(up).normalized()
    up = right.cross(direction).normalized()
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    nu, nv = 18, 8
    grid = {}
    for i in range(nu + 1):
        for j in range(nv + 1):
            u = (i / nu - 0.5) * w
            v = (j / nv - 0.5) * h
            # cantos arredondados (superelipse)
            su = (2 * u / w)
            sv = (2 * v / h)
            k = (abs(su) ** 4 + abs(sv) ** 4) ** 0.25
            if k > 1:
                u /= k
                v /= k
            o = center + right * u + up * v - direction * 1.5
            hit = tree.ray_cast(o, direction)
            if hit[0] is None:
                bm.free()
                return None
            grid[i, j] = bm.verts.new(hit[0] - direction * offset)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh), parent)
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        if p.normal.dot(direction) > 0:
            p.flip()
    sol = obj.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = thickness
    sol.offset = 1.0
    bev = obj.modifiers.new("bevel", "BEVEL")
    bev.width = 0.004
    bev.segments = 2
    for m in list(obj.modifiers):
        apply_modifier(obj, m)
    obj.data.polygons.foreach_set("use_smooth", [True] * len(obj.data.polygons))
    return obj


def decal_quad(name: str, tree: BVHTree, corners: list[Vector], direction: Vector, mat,
               thickness: float = 0.006, offset: float = 0.002, nu: int = 24, nv: int = 10,
               parent=None) -> bpy.types.Object | None:
    """Peça fina com contorno de quadrilátero (vidros, frisos), projetada na carroceria.

    corners: 4 cantos aproximados; cada ponto da grade é projetado na superfície
    na direção `direction`.
    """
    a, b, c, d = corners
    center = (a + b + c + d) / 4
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = {}
    for i in range(nu + 1):
        u = i / nu
        for j in range(nv + 1):
            v = j / nv
            p = a.lerp(b, u).lerp(d.lerp(c, u), v)
            hit = tree.ray_cast(p - direction * 0.6, direction)
            # ponto fora da carroceria: puxa um pouco para o centro da peça
            k = 0
            while hit[0] is None and k < 8:
                k += 1
                p = p.lerp(center, 0.04)
                hit = tree.ray_cast(p - direction * 0.6, direction)
            if hit[0] is None:
                bm.free()
                print(f"  aviso: {name} saiu da carroceria")
                return None
            grid[i, j] = bm.verts.new(hit[0] - direction * offset)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    obj = link(bpy.data.objects.new(name, mesh), parent)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        if poly.normal.dot(direction) > 0:
            poly.flip()
    sol = obj.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = thickness
    sol.offset = 1.0
    apply_modifier(obj, sol)
    obj.data.polygons.foreach_set("use_smooth", [True] * len(obj.data.polygons))
    return obj


def rounded_box(name: str, size, location, mat, parent=None, bevel=0.3, rotation=(0, 0, 0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    m = obj.modifiers.new("bevel", "BEVEL")
    m.width = min(size) * bevel
    m.segments = 4
    m.limit_method = "NONE"
    apply_modifier(obj, m)
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    obj.parent = parent
    return obj


def add_glass(body_root, tree: BVHTree, spec: CarSpec, mats: dict) -> None:
    """Vidros, coluna B preta, frisos das portas e saias laterais."""
    fx0, fx1, rx1, rx0 = spec.side_glass
    lo = spec.belt + 0.03
    hi = spec.roof - 0.075
    for s in (1, -1):
        d = Vector((0, -s, 0))
        y = s * 2.0

        def P(x, z):
            return Vector((x, y, z))

        bp = spec.b_pillar
        if bp is not None:
            # janela dianteira e traseira separadas pela coluna B
            decal_quad("glass_side_front", tree, [P(fx0, lo), P(bp + 0.04, lo), P(bp + 0.04, hi), P(fx1, hi)], d, mats["glass"], parent=body_root)
            decal_quad("glass_side_rear", tree, [P(bp - 0.04, lo), P(rx0, lo), P(rx1, hi), P(bp - 0.04, hi)], d, mats["glass"], parent=body_root)
            decal_quad("b_pillar", tree, [P(bp + 0.04, lo), P(bp - 0.04, lo), P(bp - 0.04, hi), P(bp + 0.04, hi)], d, mats["trim_gloss"], parent=body_root, nu=3)
        else:
            decal_quad("glass_side", tree, [P(fx0, lo), P(rx0, lo), P(rx1, hi), P(fx1, hi)], d, mats["glass"], parent=body_root)
        # frisos das portas (linhas finas escuras)
        for x, z0 in spec.door_lines:
            decal_quad("door_line", tree, [P(x + 0.002, z0), P(x - 0.002, z0), P(x - 0.002, spec.belt - 0.005), P(x + 0.002, spec.belt - 0.005)],
                       d, mats["trim"], parent=body_root, nu=1, nv=20, thickness=0.002, offset=0.0005)
        # saia lateral preta entre as rodas
        r = spec.arch_radius
        decal_quad("side_skirt", tree, [P(spec.front_axle - r - 0.03, spec.sill + 0.005), P(spec.rear_axle + r + 0.03, spec.sill + 0.005),
                                        P(spec.rear_axle + r + 0.03, spec.sill + 0.075), P(spec.front_axle - r - 0.03, spec.sill + 0.075)],
                   d, mats["trim"], parent=body_root, nu=20, nv=3, thickness=0.004)

    # para-brisa: projetado de frente/cima
    hw_base = half_width(spec, spec.windshield_base - 0.05, spec.belt + 0.03) - 0.07
    top_x = spec.side_glass[1] - 0.04
    hw_top = half_width(spec, top_x, spec.roof - 0.06) - 0.07
    d = Vector((-0.75, 0, -0.66)).normalized()
    decal_quad("windshield", tree, [Vector((spec.windshield_base, -hw_base, spec.belt + 0.03)), Vector((spec.windshield_base, hw_base, spec.belt + 0.03)),
                                    Vector((top_x, hw_top, spec.roof - 0.06)), Vector((top_x, -hw_top, spec.roof - 0.06))],
               d, mats["glass"], parent=body_root, nu=12, nv=16)
    # vidro traseiro
    if spec.rear_glass:
        z0, z1 = spec.rear_glass
        d = Vector((0.85, 0, -0.5)).normalized()
        xb = spec.side_glass[3]
        xt = spec.side_glass[2] - 0.08
        hb = half_width(spec, xb, z0) - 0.08
        ht = half_width(spec, xt, z1) - 0.08
        decal_quad("rear_glass", tree, [Vector((xb, hb, z0)), Vector((xb, -hb, z0)), Vector((xt, -ht, z1)), Vector((xt, ht, z1))],
                   d, mats["glass"], parent=body_root, nu=12, nv=12)


def add_details(body_root, shell, spec: CarSpec, mats: dict) -> None:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    tree = BVHTree.FromObject(shell, depsgraph)
    X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
    front = spec.length / 2

    # Faróis
    hz, hy, hh = spec.headlight
    for s in (1, -1):
        d = Vector((-1, -0.35 * s, 0)).normalized()
        decal(f"headlight_{'l' if s > 0 else 'r'}", tree, Vector((front, s * hy, hz)), d,
              (0.34, hh), Z, mats["headlight"], parent=body_root, thickness=0.01)
    # Grade e entrada de ar
    decal("grille", tree, Vector((front, 0, spec.headlight[0] - 0.02)), -X, (0.62, 0.08), Z,
          mats["trim_gloss"], parent=body_root)
    decal("intake", tree, Vector((front, 0, spec.sill + 0.17)), -X, (0.95, 0.13), Z,
          mats["trim"], parent=body_root, thickness=0.01)
    # Lanternas
    tz, ty, th = spec.taillight
    for s in (1, -1):
        d = Vector((1, -0.8 * s, 0)).normalized()
        decal(f"taillight_{'l' if s > 0 else 'r'}", tree, Vector((-front, s * ty, tz)), d,
              (0.34, th), Z, mats["taillight"], parent=body_root, thickness=0.01)
    # para-choque traseiro: faixa preta embaixo
    decal("rear_diffuser", tree, Vector((-front, 0, spec.sill + 0.11)), X, (1.15, 0.12), Z,
          mats["trim"], parent=body_root, thickness=0.01)
    add_glass(body_root, tree, spec, mats)

    # Retrovisores
    for s in (1, -1):
        hit = surface_point(tree, Vector((spec.windshield_base - 0.14, s * 2.0, spec.belt - 0.03)), Vector((0, -s, 0)))
        if hit:
            p = hit[0]
            rounded_box(f"mirror_{'l' if s > 0 else 'r'}", (0.11, 0.17, 0.10),
                        (p.x, p.y + s * 0.11, p.z + 0.1), mats["paint"], body_root, bevel=0.45)
            rounded_box(f"mirror_glass_{'l' if s > 0 else 'r'}", (0.01, 0.14, 0.075),
                        (p.x - 0.055, p.y + s * 0.11, p.z + 0.1), mats["chrome"], body_root, bevel=0.3)
            rounded_box(f"mirror_arm_{'l' if s > 0 else 'r'}", (0.07, 0.1, 0.04),
                        (p.x, p.y + s * 0.03, p.z + 0.05), mats["trim"], body_root, bevel=0.4)
        else:
            print("  aviso: retrovisor não encontrou a carroceria")

    # Maçanetas
    # maçaneta logo à frente de cada junta traseira de porta
    handle_xs = [x + 0.14 for x, _ in spec.door_lines[1:]]
    for x in handle_xs:
        for s in (1, -1):
            hit = surface_point(tree, Vector((x, s * 2.0, spec.belt - 0.09)), Vector((0, -s, 0)))
            if hit:
                p = hit[0]
                rounded_box("door_handle", (0.13, 0.02, 0.025), (p.x, p.y + s * 0.006, p.z), mats["trim_gloss"], body_root, bevel=0.45)

    # Interior simples (aparece pelos vidros)
    inner = spec.roof_half_width - 0.05
    rounded_box("dashboard", (0.35, inner * 2, 0.16), (spec.windshield_base - 0.32, 0, spec.belt + 0.02), mats["interior"], body_root, bevel=0.2)
    for s in (1, -1):
        rounded_box("seat", (0.14, 0.5, 0.62), ((spec.b_pillar or -0.6) - 0.05, s * 0.36, spec.belt + 0.05), mats["interior"], body_root, bevel=0.25, rotation=(0, 0.18, 0))
    rounded_box("rear_seat", (0.16, inner * 2 - 0.1, 0.5), ((spec.b_pillar or -0.6) - 0.75, 0, spec.belt + 0.02), mats["interior"], body_root, bevel=0.25, rotation=(0, 0.2, 0))


def darken_under_glass(shell, body_root, mats: dict) -> None:
    """Pinta de escuro a lataria que fica embaixo dos vidros.

    Os vidros são peças finas por cima da carroceria; sem isso, com insulfilm claro
    daria para ver a cor da lataria através deles.
    """
    glass_objs = [o for o in body_root.children if o.data and o.active_material is mats["glass"]]
    if not glass_objs:
        return
    depsgraph = bpy.context.evaluated_depsgraph_get()
    trees = [(o, BVHTree.FromObject(o, depsgraph)) for o in glass_objs]
    shell.data.materials.append(mats["interior"])
    dark = len(shell.data.materials) - 1
    for poly in shell.data.polygons:
        c = shell.matrix_world @ poly.center
        for o, tree in trees:
            local = o.matrix_world.inverted() @ c
            hit = tree.find_nearest(local, 0.009)
            if hit[0] is not None:
                poly.material_index = dark
                break


# ---------------------------------------------------------------------------
# Rodas (o app troca pelas rodas do configurador)
# ---------------------------------------------------------------------------

def make_wheel(name: str, location, side: int, mats: dict) -> bpy.types.Object:
    empty = link(bpy.data.objects.new(name, None))
    empty.empty_display_type = "CIRCLE"
    empty.location = location

    tire_r, rim_r, w = 0.30, 0.19, 0.195
    # pneu: perfil girado (lathe) em volta do eixo Y
    prof = [(rim_r + 0.005, -w / 2 + 0.01), (rim_r + 0.02, -w / 2), (tire_r - 0.03, -w / 2), (tire_r - 0.008, -w / 2 + 0.015),
            (tire_r, -w / 2 + 0.045), (tire_r, w / 2 - 0.045), (tire_r - 0.008, w / 2 - 0.015), (tire_r - 0.03, w / 2),
            (rim_r + 0.02, w / 2), (rim_r + 0.005, w / 2 - 0.01)]
    mesh = bpy.data.meshes.new(f"{name}_tire")
    bm = bmesh.new()
    seg = 64
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        rings.append([bm.verts.new((math.cos(a) * r, y, math.sin(a) * r)) for r, y in prof])
    for i in range(seg):
        r0, r1 = rings[i], rings[(i + 1) % seg]
        for j in range(len(prof) - 1):
            bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    tire = link(bpy.data.objects.new(f"{name}_tire", mesh), empty)
    tire.data.materials.append(mats["tire"])
    tire.data.polygons.foreach_set("use_smooth", [True] * len(tire.data.polygons))

    # aro: disco + 5 raios
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=rim_r, depth=0.02, location=(0, side * 0.06, 0), rotation=(math.pi / 2, 0, 0))
    disc = bpy.context.active_object
    disc.name = f"{name}_rim"
    disc.parent = empty
    disc.data.materials.append(mats["trim"])
    for k in range(5):
        a = 2 * math.pi * k / 5
        rounded_box(f"{name}_spoke", (0.15, 0.025, 0.04),
                    (math.cos(a) * 0.1, side * 0.075, math.sin(a) * 0.1), mats["rim"], empty, bevel=0.3, rotation=(0, -a, 0))
    bpy.ops.mesh.primitive_torus_add(major_radius=rim_r, minor_radius=0.01, location=(0, side * 0.08, 0), rotation=(math.pi / 2, 0, 0))
    lip = bpy.context.active_object
    lip.parent = empty
    lip.data.materials.append(mats["rim"])
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.05, depth=0.03, location=(0, side * 0.08, 0), rotation=(math.pi / 2, 0, 0))
    hub = bpy.context.active_object
    hub.parent = empty
    hub.data.materials.append(mats["rim"])
    return empty


# ---------------------------------------------------------------------------
# Montagem
# ---------------------------------------------------------------------------

def build(spec: CarSpec) -> bpy.types.Object:
    reset_scene()
    mats = make_materials()

    body_root = link(bpy.data.objects.new("body", None))
    shell = build_shell(spec)
    shell.data.materials.clear()
    shell.data.materials.append(mats["paint"])
    shell.parent = body_root
    shell.data.polygons.foreach_set("use_smooth", [True] * len(shell.data.polygons))

    add_details(body_root, shell, spec, mats)
    darken_under_glass(shell, body_root, mats)

    z = spec.width / 2 - 0.125
    for slot, (x, y) in {
        "wheel_fl": (spec.front_axle, z),
        "wheel_fr": (spec.front_axle, -z),
        "wheel_rl": (spec.rear_axle, z),
        "wheel_rr": (spec.rear_axle, -z),
    }.items():
        make_wheel(slot, (x, y, spec.wheel_center), 1 if y > 0 else -1, mats)
    return body_root


def main(argv: list[str]) -> None:
    kind = argv[0] if argv else "hatch"
    out = argv[1] if len(argv) > 1 else f"{kind}.glb"
    build(SPECS[kind])
    bpy.ops.wm.save_as_mainfile(filepath=out.replace(".glb", ".blend"))
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_apply=True)
    print(f"Gerado: {out}")


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(args)
