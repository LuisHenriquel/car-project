import * as THREE from 'three'
import type { BodyType, VehicleSpecs } from '../../api/types'

// Carro simples usado enquanto um carro do catálogo não tem modelo .glb.
// A lateral do carro é desenhada como um perfil 2D (X = comprimento, Y = altura)
// e extrudada na largura (Z). O "bevel" arredonda as bordas e expande o contorno,
// por isso as medidas do contorno são compensadas com BEVEL.

export const BEVEL = 0.04
export const BEVEL_T = 0.06
export const GLASS_BEVEL = 0.03
export const GLASS_BEVEL_T = 0.05

type P = [number, number]

export interface Cabin {
  start: P
  c1: P
  roofFront: P
  roofBack: P
  c2: P
  end: P
  width: number
}

/** Medidas que dependem do tipo de carroceria (alturas e área envidraçada). */
interface BodyStyle {
  hood: number
  cowl: number
  belt: number
  headY: number
  tailY: number
  cabin: Cabin
  bPillar: number | null
  /** desenha a parte de cima, do para-brisa até a traseira */
  top: (s: THREE.Shape, rear: number) => void
  bed?: { front: number; floor: number; top: number }
}

const STYLES: Record<BodyType, BodyStyle> = {
  hatch: {
    hood: 0.72, cowl: 0.86, belt: 0.88, headY: 0.63, tailY: 0.8, bPillar: -0.5,
    cabin: { start: [0.9, 0.84], c1: [0.42, 1.2], roofFront: [-0.05, 1.4], roofBack: [-1.2, 1.43], c2: [-1.62, 1.41], end: [-1.78, 0.92], width: 1.46 },
    top(s, rear) {
      s.lineTo(-1.5, 0.95)
      s.quadraticCurveTo(rear - 0.02, 0.95, rear, 0.72)
    },
  },
  sedan: {
    hood: 0.7, cowl: 0.96, belt: 0.88, headY: 0.61, tailY: 0.86, bPillar: -0.42,
    cabin: { start: [1.0, 0.84], c1: [0.5, 1.2], roofFront: [0.0, 1.39], roofBack: [-0.95, 1.41], c2: [-1.45, 1.36], end: [-1.74, 0.94], width: 1.48 },
    top(s, rear) {
      s.lineTo(-1.75, 0.97)
      s.lineTo(rear + 0.2, 0.98)
      s.quadraticCurveTo(rear - 0.02, 0.98, rear, 0.76)
    },
  },
  pickup: {
    hood: 0.84, cowl: 0.98, belt: 0.98, headY: 0.74, tailY: 0.9, bPillar: null,
    cabin: { start: [1.02, 0.94], c1: [0.56, 1.28], roofFront: [0.08, 1.48], roofBack: [-0.72, 1.5], c2: [-0.86, 1.49], end: [-0.88, 0.96], width: 1.56 },
    // a caçamba fica acima da caixa de roda traseira
    bed: { front: -0.94, floor: 0.8, top: 1.07 },
    top(s, rear) {
      s.lineTo(-0.9, 1.0)
      s.lineTo(-0.9, 0.76)
      s.lineTo(rear, 0.76)
    },
  },
}

export interface Layout {
  style: BodyStyle
  width: number
  /** contorno (antes do bevel) */
  front: number
  rear: number
  frontAxle: number
  rearAxle: number
  wheelCenter: number
  archR: number
  sill: number
}

export function layoutFor(bodyType: BodyType, specs: VehicleSpecs): Layout {
  const length = specs.lengthMm / 1000
  const frontAxle = specs.frontAxleOffsetMm / 1000
  return {
    style: STYLES[bodyType],
    width: specs.widthMm / 1000,
    front: length / 2 - BEVEL,
    rear: -length / 2 + BEVEL,
    frontAxle,
    rearAxle: frontAxle - specs.wheelbaseMm / 1000,
    wheelCenter: specs.wheelCenterHeightMm / 1000,
    archR: specs.archRadiusMm / 1000,
    sill: specs.groundClearanceMm / 1000,
  }
}

export function lowerShape(l: Layout) {
  const s = new THREE.Shape()
  const r = l.archR + BEVEL
  const wc = l.wheelCenter
  const sill = l.sill + BEVEL
  const { front, rear } = l
  const st = l.style
  s.moveTo(rear + 0.06, sill + 0.06)
  s.lineTo(l.rearAxle - r - 0.04, sill + 0.01)
  s.lineTo(l.rearAxle - r, wc)
  s.absarc(l.rearAxle, wc, r, Math.PI, 0, true)
  s.lineTo(l.rearAxle + r + 0.04, sill)
  s.lineTo(l.frontAxle - r - 0.04, sill)
  s.lineTo(l.frontAxle - r, wc)
  s.absarc(l.frontAxle, wc, r, Math.PI, 0, true)
  s.lineTo(l.frontAxle + r + 0.04, sill + 0.02)
  s.lineTo(front - 0.12, sill + 0.05)
  s.quadraticCurveTo(front, sill + 0.08, front, (sill + st.hood) / 2)
  s.quadraticCurveTo(front, st.hood - 0.02, front - 0.22, st.hood)
  s.lineTo(st.cowl, st.belt)
  st.top(s, rear)
  s.lineTo(rear + 0.02, sill + 0.2)
  s.lineTo(rear + 0.06, sill + 0.06)
  return s
}

export function cabinShape(c: Cabin) {
  const s = new THREE.Shape()
  s.moveTo(...c.start)
  s.quadraticCurveTo(...c.c1, ...c.roofFront)
  s.lineTo(...c.roofBack)
  s.quadraticCurveTo(...c.c2, ...c.end)
  s.lineTo(c.end[0], c.start[1] - 0.02)
  s.lineTo(c.start[0], c.start[1] - 0.02)
  s.closePath()
  return s
}

export function extrude(shape: THREE.Shape, width: number, bevel: number, bevelT: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * bevelT,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 32,
  })
  g.translate(0, 0, -(width - 2 * bevelT) / 2)
  g.computeVertexNormals()
  return g
}
