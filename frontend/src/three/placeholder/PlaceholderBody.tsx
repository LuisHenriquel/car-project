import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BodyType, VehicleSpecs } from '../../api/types'
import { BEVEL, BEVEL_T, GLASS_BEVEL, GLASS_BEVEL_T, cabinShape, extrude, layoutFor, lowerShape } from './profiles'

type P = [number, number]

/** Barra entre dois pontos do perfil, num plano Z fixo (colunas A/B/C). */
function Strut({ a, b, z, thick = 0.075, material }: { a: P; b: P; z: number; thick?: number; material: THREE.Material }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return (
    <mesh material={material} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx)]}>
      <boxGeometry args={[Math.hypot(dx, dy) + 0.03, thick, 0.014]} />
    </mesh>
  )
}

function Box({ p, s, m, r }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number] }) {
  return (
    <mesh position={p} rotation={r} material={m}>
      <boxGeometry args={s} />
    </mesh>
  )
}

interface Props {
  bodyType: BodyType
  specs: VehicleSpecs
  paint: THREE.Material
  glass: THREE.Material
}

/** Carroceria simples (sem rodas). Substituída pelo .glb quando o carro tiver modelo. */
export default function PlaceholderBody({ bodyType, specs, paint, glass }: Props) {
  const l = useMemo(() => layoutFor(bodyType, specs), [bodyType, specs])
  const st = l.style
  const c = st.cabin
  const W = l.width

  const lowerGeo = useMemo(() => extrude(lowerShape(l), W, BEVEL, BEVEL_T), [l, W])
  const cabinGeo = useMemo(() => extrude(cabinShape(c), c.width, GLASS_BEVEL, GLASS_BEVEL_T), [c])
  useEffect(() => () => lowerGeo.dispose(), [lowerGeo])
  useEffect(() => () => cabinGeo.dispose(), [cabinGeo])

  const mats = useMemo(
    () => ({
      black: new THREE.MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.55 }),
      interior: new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.9 }),
      head: new THREE.MeshStandardMaterial({ color: '#e9f3ff', emissive: '#cfe6ff', emissiveIntensity: 0.9, roughness: 0.1 }),
      tail: new THREE.MeshStandardMaterial({ color: '#7a0008', emissive: '#ff1a1a', emissiveIntensity: 0.7, roughness: 0.2 }),
      liner: new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.95 }),
    }),
    [],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const zSide = c.width / 2 + 0.004
  const roofMid: P = [(c.roofFront[0] + c.roofBack[0]) / 2, (c.roofFront[1] + c.roofBack[1]) / 2]
  const roofLen = Math.hypot(c.roofFront[0] - c.roofBack[0], c.roofFront[1] - c.roofBack[1])
  const roofAngle = Math.atan2(c.roofFront[1] - c.roofBack[1], c.roofFront[0] - c.roofBack[0])
  const roofYAt = (x: number) => c.roofFront[1] + ((x - c.roofFront[0]) / (c.roofBack[0] - c.roofFront[0])) * (c.roofBack[1] - c.roofFront[1])
  const rearX = l.rear - BEVEL
  const sideZ = W / 2 + 0.0015
  const bed = st.bed

  return (
    <group name="body">
      <mesh geometry={lowerGeo} material={paint} />
      <mesh geometry={cabinGeo} material={glass} />

      {/* teto e colunas */}
      <Box p={[roofMid[0], roofMid[1] + GLASS_BEVEL - 0.002, 0]} r={[0, 0, roofAngle]} s={[roofLen + 0.04, 0.026, c.width + 0.008]} m={paint} />
      {([-1, 1] as const).map((sd) => (
        <group key={sd}>
          <Strut a={c.start} b={c.roofFront} z={sd * zSide} material={paint} />
          <Strut a={c.roofBack} b={c.end} z={sd * zSide} material={paint} thick={0.09} />
          {st.bPillar !== null && (
            <>
              <Strut a={[st.bPillar, st.belt]} b={[st.bPillar - 0.02, roofYAt(st.bPillar)]} z={sd * zSide} material={mats.black} thick={0.07} />
              <Box p={[st.bPillar, (l.sill + st.belt) / 2 + 0.02, sd * sideZ]} s={[0.006, st.belt - l.sill - 0.08, 0.002]} m={mats.black} />
            </>
          )}
          <Box p={[st.cowl - 0.02, (l.sill + st.belt) / 2 + 0.02, sd * sideZ]} s={[0.006, st.belt - l.sill - 0.08, 0.002]} m={mats.black} />
          {/* retrovisor */}
          <Box p={[st.cowl - 0.1, st.belt + 0.1, sd * (W / 2 + 0.07)]} s={[0.1, 0.09, 0.15]} m={paint} />
        </group>
      ))}

      {/* interior simples */}
      <Box p={[c.start[0] - 0.25, st.belt + 0.05, 0]} s={[0.3, 0.12, c.width - 0.1]} m={mats.interior} />
      {[-0.36, 0.36].map((z) => (
        <Box key={z} p={[(st.bPillar ?? c.end[0] + 0.25) - 0.05, st.belt + 0.18, z]} r={[0, 0, 0.18]} s={[0.12, 0.5, 0.48]} m={mats.interior} />
      ))}

      {/* frente */}
      {[-1, 1].map((sd) => (
        <Box key={sd} p={[l.front - 0.01, st.headY, sd * (W / 2 - 0.24)]} s={[0.12, 0.07, 0.32]} m={mats.head} />
      ))}
      <Box p={[l.front + 0.005, st.headY - 0.02, 0]} s={[0.14, 0.11, 0.62]} m={mats.black} />
      <Box p={[l.front - 0.02, l.sill + 0.16, 0]} s={[0.14, 0.09, W - 0.5]} m={mats.black} />

      {/* traseira */}
      {!bed &&
        [-1, 1].map((sd) => (
          <Box key={sd} p={[l.rear, st.tailY, sd * (W / 2 - 0.2)]} s={[0.15, 0.08, 0.3]} m={mats.tail} />
        ))}

      {/* caçamba da picape */}
      {bed && (
        <>
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Box p={[(bed.front + rearX) / 2, (bed.floor - 0.04 + bed.top) / 2, sd * (W / 2 - 0.04)]} s={[bed.front - rearX, bed.top - bed.floor + 0.04, 0.08]} m={paint} />
              <Box p={[rearX + 0.02, st.tailY, sd * (W / 2 - 0.06)]} s={[0.06, 0.26, 0.11]} m={mats.tail} />
            </group>
          ))}
          <Box p={[rearX + 0.04, (bed.floor + bed.top) / 2, 0]} s={[0.07, bed.top - bed.floor, W - 0.24]} m={paint} />
          <Box p={[(bed.front + rearX) / 2, bed.floor + 0.005, 0]} s={[bed.front - rearX - 0.1, 0.01, W - 0.16]} m={mats.liner} />
        </>
      )}
    </group>
  )
}
