import { useMemo } from 'react'
import * as THREE from 'three'
import { wheelDims, TIRE_WIDTH } from './specs'
import { RIM_COLORS } from '../data/options'

// Roda montada com eixo em Z; a face externa fica voltada para +Z.
// O lado esquerdo do carro usa a mesma roda girada 180° em Y.

function tireGeometry(rimR, tireR, w) {
  const h = w / 2
  const pts = [
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
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const g = new THREE.LatheGeometry(pts, 64)
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}

function Spokes({ style, rimR, mat }) {
  const items = []
  const inner = 0.055
  const outer = rimR - 0.012
  const len = outer - inner
  const mid = (outer + inner) / 2
  const z = 0.055

  if (style === 'esportiva' || style === 'multiraios') {
    const n = style === 'esportiva' ? 5 : 10
    const w = style === 'esportiva' ? 0.05 : 0.02
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      items.push(
        <mesh key={i} material={mat} position={[Math.cos(a) * mid, Math.sin(a) * mid, z]} rotation={[0, 0, a]}>
          <boxGeometry args={[len, w, 0.028]} />
        </mesh>,
      )
      if (style === 'esportiva') {
        // raio duplo fino ao lado do principal
        const b = a + Math.PI / n
        items.push(
          <mesh key={`b${i}`} material={mat} position={[Math.cos(b) * mid, Math.sin(b) * mid, z - 0.006]} rotation={[0, 0, b]}>
            <boxGeometry args={[len, 0.014, 0.02]} />
          </mesh>,
        )
      }
    }
  } else if (style === 'tela') {
    const n = 12
    for (let i = 0; i < n; i++) {
      for (const dir of [-1, 1]) {
        const a = (i / n) * Math.PI * 2
        const tilt = dir * 0.38
        items.push(
          <mesh key={`${i}${dir}`} material={mat} position={[Math.cos(a) * mid, Math.sin(a) * mid, z - (dir > 0 ? 0.004 : 0)]} rotation={[0, 0, a + tilt]}>
            <boxGeometry args={[len * 1.05, 0.012, 0.016]} />
          </mesh>,
        )
      }
    }
  } else if (style === 'disco') {
    items.push(
      <mesh key="disc" material={mat} position={[0, 0, z - 0.008]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[outer, outer, 0.02, 48]} />
      </mesh>,
    )
  }
  return <group>{items}</group>
}

export default function Wheel({ rim, style, rimColor, caliper, side = 1, ...props }) {
  const { rimR, tireR } = wheelDims(rim)
  const w = TIRE_WIDTH

  const tireGeo = useMemo(() => tireGeometry(rimR, tireR, w), [rimR, tireR, w])
  const rc = RIM_COLORS[rimColor] ?? RIM_COLORS.prata

  const rimMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: rc.hex, metalness: rc.metalness, roughness: rc.roughness, clearcoat: 0.5 }),
    [rc.hex, rc.metalness, rc.roughness],
  )
  const tireMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.88 }), [])
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.7, side: THREE.DoubleSide }), [])
  const discMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d8187', metalness: 0.9, roughness: 0.45 }), [])
  const caliperMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: caliper, roughness: 0.35, clearcoat: 1 }), [caliper])

  const lugs = Array.from({ length: 4 }, (_, i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    return [Math.cos(a) * 0.036, Math.sin(a) * 0.036]
  })
  const holeAngles = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)

  return (
    <group {...props}>
      <group rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
        <mesh geometry={tireGeo} material={tireMat} />
        {/* barril da roda */}
        <mesh material={darkMat} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[rimR + 0.004, rimR + 0.004, w * 0.86, 48, 1, true]} />
        </mesh>
        {/* borda (lábio) */}
        <mesh material={rimMat} position={[0, 0, w * 0.4]}>
          <torusGeometry args={[rimR, 0.009, 10, 64]} />
        </mesh>
        {/* disco de freio e pinça */}
        <mesh material={discMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
          <cylinderGeometry args={[rimR - 0.035, rimR - 0.035, 0.024, 40]} />
        </mesh>
        <mesh material={caliperMat} position={[-(rimR - 0.06) * 0.7, (rimR - 0.06) * 0.7, 0.022]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 0.13, 0.05]} />
        </mesh>
        <Spokes style={style} rimR={rimR} mat={rimMat} />
        {style === 'disco' &&
          holeAngles.map((a, i) => (
            <mesh key={i} material={darkMat} position={[Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, 0.0605]}>
              <circleGeometry args={[rimR * 0.13, 24]} />
            </mesh>
          ))}
        {/* cubo central e parafusos */}
        <mesh material={rimMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.058, 0.058, 0.03, 32]} />
        </mesh>
        {lugs.map(([x, y], i) => (
          <mesh key={i} material={darkMat} rotation={[Math.PI / 2, 0, 0]} position={[x, y, 0.077]}>
            <cylinderGeometry args={[0.008, 0.008, 0.012, 12]} />
          </mesh>
        ))}
        <mesh material={darkMat} position={[0, 0, 0.0755]}>
          <circleGeometry args={[0.022, 24]} />
        </mesh>
      </group>
    </group>
  )
}
