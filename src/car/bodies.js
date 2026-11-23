import * as THREE from 'three'
import { WHEEL_CENTER, ARCH_R } from './specs'

// Eixos: X = comprimento (frente = +X), Y = altura, Z = largura. Unidades em metros.
// Os perfis são extrudados na largura. O "bevel" da extrusão expande o contorno
// para fora, então as medidas do contorno são compensadas por BEVEL.
export const BEVEL = 0.04
export const BEVEL_T = 0.06
export const GLASS_BEVEL = 0.03
export const GLASS_BEVEL_T = 0.05

/**
 * Especificação de cada carroceria.
 * front/rear: pontas do contorno; fa/ra: eixo dianteiro/traseiro;
 * sill: altura efetiva da soleira (vão livre); hood: altura do capô na frente;
 * cowl/belt: base do para-brisa; cabin: contorno da área envidraçada.
 */
export const BODIES = {
  hatch: {
    width: 1.72,
    front: 1.94, rear: -1.86, fa: 1.22, ra: -1.3,
    sill: 0.165, hood: 0.72, cowl: 0.86, belt: 0.88,
    headY: 0.63, tailY: 0.8, tailX: -1.9,
    cabinWidth: 1.46,
    cabin: { start: [0.9, 0.84], c1: [0.42, 1.2], roofF: [-0.05, 1.4], roofB: [-1.2, 1.43], c2: [-1.62, 1.41], end: [-1.78, 0.92] },
    bPillar: -0.5,
    top(s, p) {
      s.lineTo(-1.5, 0.95)
      s.quadraticCurveTo(p.rear - 0.02, 0.95, p.rear, 0.72)
    },
  },
  sedan: {
    width: 1.76,
    front: 2.1, rear: -2.18, fa: 1.32, ra: -1.36,
    sill: 0.155, hood: 0.7, cowl: 0.96, belt: 0.88,
    headY: 0.61, tailY: 0.86, tailX: -2.22,
    cabinWidth: 1.48,
    cabin: { start: [1.0, 0.84], c1: [0.5, 1.2], roofF: [0.0, 1.39], roofB: [-0.95, 1.41], c2: [-1.45, 1.36], end: [-1.74, 0.94] },
    bPillar: -0.42,
    top(s, p) {
      s.lineTo(-1.75, 0.97)
      s.lineTo(-2.0, 0.98)
      s.quadraticCurveTo(p.rear - 0.02, 0.98, p.rear, 0.76)
    },
  },
  picape: {
    width: 1.8,
    front: 2.12, rear: -2.3, fa: 1.42, ra: -1.42,
    sill: 0.205, hood: 0.84, cowl: 0.98, belt: 0.98,
    headY: 0.74, tailY: 0.86, tailX: -2.38,
    cabinWidth: 1.56,
    cabin: { start: [1.02, 0.94], c1: [0.56, 1.28], roofF: [0.08, 1.48], roofB: [-0.72, 1.5], c2: [-0.86, 1.49], end: [-0.88, 0.96] },
    bPillar: null,
    // o assoalho da caçamba fica acima da caixa de roda traseira
    bed: { front: -0.94, floor: 0.8, top: 1.07 },
    top(s, p) {
      s.lineTo(-0.9, 1.0)
      s.lineTo(-0.9, 0.76)
      s.lineTo(p.rear, 0.76)
    },
  },
}

export function buildLowerShape(p) {
  const s = new THREE.Shape()
  const r = ARCH_R + BEVEL
  const wc = WHEEL_CENTER
  const sill = p.sill + BEVEL
  s.moveTo(p.rear + 0.06, sill + 0.06)
  s.lineTo(p.ra - r - 0.04, sill + 0.01)
  s.lineTo(p.ra - r, wc)
  s.absarc(p.ra, wc, r, Math.PI, 0, true)
  s.lineTo(p.ra + r + 0.04, sill)
  s.lineTo(p.fa - r - 0.04, sill)
  s.lineTo(p.fa - r, wc)
  s.absarc(p.fa, wc, r, Math.PI, 0, true)
  s.lineTo(p.fa + r + 0.04, sill + 0.02)
  s.lineTo(p.front - 0.12, sill + 0.05)
  s.quadraticCurveTo(p.front, sill + 0.08, p.front, (sill + p.hood) / 2)
  s.quadraticCurveTo(p.front, p.hood - 0.02, p.front - 0.22, p.hood)
  s.lineTo(p.cowl, p.belt)
  p.top(s, p)
  s.lineTo(p.rear + 0.02, sill + 0.2)
  s.lineTo(p.rear + 0.06, sill + 0.06)
  return s
}

export function buildCabinShape(c) {
  const s = new THREE.Shape()
  s.moveTo(...c.start)
  s.quadraticCurveTo(...c.c1, ...c.roofF)
  s.lineTo(...c.roofB)
  s.quadraticCurveTo(...c.c2, ...c.end)
  s.lineTo(c.end[0], c.start[1] - 0.02)
  s.lineTo(c.start[0], c.start[1] - 0.02)
  s.closePath()
  return s
}

export function extrude(shape, width, bevel, bevelT, curveSegments = 32) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * bevelT,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments,
  })
  g.translate(0, 0, -(width - 2 * bevelT) / 2)
  g.computeVertexNormals()
  return g
}
