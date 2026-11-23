import { useEffect, useMemo, type ReactElement } from 'react'
import * as THREE from 'three'
import type { RimColor, WheelStyle } from '../api/types'
import { RIM_COLORS } from '../config/options'
import { TIRE_WIDTH, wheelDims } from '../vehicles/fitment'

// Roda completa (pneu, aro, raios, disco e pinça) com o eixo em Z.
// A face externa fica para +Z; o lado esquerdo usa a mesma roda girada 180°.

function tireGeometry(rimR: number, tireR: number, w: number) {
  const h = w / 2
  const pts: [number, number][] = [
    [rimR + 0.005, -h + 0.012],
    [rimR + 0.02, -h],
    [tireR - 0.035, -h],
    [tireR - 0.012, -h + 0.012],
    [tireR, -h + 0.04],
    [tireR, h - 0.04],
    [tireR - 0.012, h - 0.012],
    [tireR - 0.035, h],
    [rimR + 0.02, h],
    [rimR + 0.005, h - 0.012],
  ]
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64)
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}

function Spokes({ style, rimR, material }: { style: WheelStyle; rimR: number; material: THREE.Material }) {
  const inner = 0.055
  const outer = rimR - 0.012
  const len = outer - inner
  const mid = (outer + inner) / 2
  const z = 0.055
  const items: ReactElement[] = []

  if (style === 'five-spoke' || style === 'multi-spoke') {
    const n = style === 'five-spoke' ? 5 : 10
    const w = style === 'five-spoke' ? 0.05 : 0.02
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      items.push(
        <mesh key={i} material={material} position={[Math.cos(a) * mid, Math.sin(a) * mid, z]} rotation={[0, 0, a]}>
          <boxGeometry args={[len, w, 0.028]} />
        </mesh>,
      )
    }
  } else if (style === 'mesh') {
    const n = 12
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      for (const dir of [-1, 1]) {
        items.push(
          <mesh key={`${i}${dir}`} material={material} position={[Math.cos(a) * mid, Math.sin(a) * mid, z - (dir > 0 ? 0.004 : 0)]} rotation={[0, 0, a + dir * 0.38]}>
            <boxGeometry args={[len * 1.05, 0.012, 0.016]} />
          </mesh>,
        )
      }
    }
  } else {
    items.push(
      <mesh key="disc" material={material} position={[0, 0, z - 0.008]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[outer, outer, 0.02, 48]} />
      </mesh>,
    )
  }
  return <group>{items}</group>
}

export interface WheelProps {
  rimInches: number
  style: WheelStyle
  rimColor: RimColor
  caliperColor: string
  /** 1 = lado direito (+Z), -1 = lado esquerdo */
  side: 1 | -1
  position: [number, number, number]
  camberDeg: number
}

export default function Wheel({ rimInches, style, rimColor, caliperColor, side, position, camberDeg }: WheelProps) {
  const { rimR, tireR } = wheelDims(rimInches)
  const rc = RIM_COLORS[rimColor]

  const tireGeo = useMemo(() => tireGeometry(rimR, tireR, TIRE_WIDTH), [rimR, tireR])
  const mats = useMemo(
    () => ({
      rim: new THREE.MeshPhysicalMaterial({ color: rc.hex, metalness: rc.metalness, roughness: rc.roughness, clearcoat: 0.5 }),
      tire: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.88 }),
      dark: new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.7, side: THREE.DoubleSide }),
      disc: new THREE.MeshStandardMaterial({ color: '#7d8187', metalness: 0.9, roughness: 0.45 }),
      caliper: new THREE.MeshPhysicalMaterial({ color: caliperColor, roughness: 0.35, clearcoat: 1 }),
    }),
    [rc, caliperColor],
  )
  useEffect(() => () => {
    tireGeo.dispose()
  }, [tireGeo])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const camber = THREE.MathUtils.degToRad(camberDeg)
  const lugs = [0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    return [Math.cos(a) * 0.036, Math.sin(a) * 0.036] as const
  })
  const holes = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)

  return (
    // Cambagem: o topo da roda inclina para dentro do carro.
    <group position={position} rotation={[-side * camber, 0, 0]}>
      <group rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
        <mesh geometry={tireGeo} material={mats.tire} />
        <mesh material={mats.dark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[rimR + 0.004, rimR + 0.004, TIRE_WIDTH * 0.86, 48, 1, true]} />
        </mesh>
        <mesh material={mats.rim} position={[0, 0, TIRE_WIDTH * 0.4]}>
          <torusGeometry args={[rimR, 0.009, 10, 64]} />
        </mesh>
        <mesh material={mats.disc} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
          <cylinderGeometry args={[rimR - 0.035, rimR - 0.035, 0.024, 40]} />
        </mesh>
        <mesh material={mats.caliper} position={[-(rimR - 0.06) * 0.7, (rimR - 0.06) * 0.7, 0.022]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 0.13, 0.05]} />
        </mesh>
        <Spokes style={style} rimR={rimR} material={mats.rim} />
        {style === 'dish' &&
          holes.map((a, i) => (
            <mesh key={i} material={mats.dark} position={[Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, 0.0605]}>
              <circleGeometry args={[rimR * 0.13, 24]} />
            </mesh>
          ))}
        <mesh material={mats.rim} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.058, 0.058, 0.03, 32]} />
        </mesh>
        {lugs.map(([x, y], i) => (
          <mesh key={i} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[x, y, 0.077]}>
            <cylinderGeometry args={[0.008, 0.008, 0.012, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
