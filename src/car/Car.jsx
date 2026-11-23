import { useMemo } from 'react'
import * as THREE from 'three'
import { BODIES, BEVEL, GLASS_BEVEL, GLASS_BEVEL_T, BEVEL_T, buildLowerShape, buildCabinShape, extrude } from './bodies'
import { wheelDims } from './specs'
import { FINISHES } from '../data/options'
import Wheel from './Wheel'

// Placa padrão Mercosul desenhada em canvas.
function makePlateTexture(text = 'CAR1P26') {
  const c = document.createElement('canvas')
  c.width = 400
  c.height = 130
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 400, 130)
  g.fillStyle = '#1f4aa8'
  g.fillRect(0, 0, 400, 30)
  g.fillStyle = '#ffffff'
  g.font = 'bold 18px Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('BRASIL', 200, 22)
  g.fillStyle = '#111'
  g.font = 'bold 74px "Arial Narrow", Arial, sans-serif'
  g.fillText(text, 200, 112)
  g.strokeStyle = '#111'
  g.lineWidth = 6
  g.strokeRect(3, 3, 394, 124)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// Barra entre dois pontos (x,y) num plano Z fixo — usada para colunas A/B/C.
function Strut({ a, b, z, thick = 0.075, depth = 0.014, material }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  return (
    <mesh material={material} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx)]}>
      <boxGeometry args={[len + 0.03, thick, depth]} />
    </mesh>
  )
}

function Box({ p, s, m, r }) {
  return (
    <mesh position={p} rotation={r} material={m}>
      <boxGeometry args={s} />
    </mesh>
  )
}

export default function Car({ cfg, ref }) {
  const spec = BODIES[cfg.body] ?? BODIES.hatch
  const W = spec.width
  const c = spec.cabin

  const lowerGeo = useMemo(() => extrude(buildLowerShape(spec), W, BEVEL, BEVEL_T), [spec, W])
  const cabinGeo = useMemo(() => extrude(buildCabinShape(c), spec.cabinWidth, GLASS_BEVEL, GLASS_BEVEL_T), [c, spec.cabinWidth])

  const finish = FINISHES[cfg.finish] ?? FINISHES.metalica
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: cfg.paint,
        metalness: finish.metalness,
        roughness: finish.roughness,
        clearcoat: finish.clearcoat,
        clearcoatRoughness: 0.08,
        iridescence: finish.iridescence,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [200, 700],
      }),
    [cfg.paint, finish],
  )
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0e151d',
        metalness: 0.1,
        roughness: 0.04,
        clearcoat: 1,
        transparent: true,
        opacity: 0.42 + (cfg.tint / 100) * 0.55,
      }),
    [cfg.tint],
  )
  const mats = useMemo(
    () => ({
      black: new THREE.MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.55 }),
      gloss: new THREE.MeshPhysicalMaterial({ color: '#08090a', roughness: 0.15, clearcoat: 1 }),
      interior: new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.9 }),
      head: new THREE.MeshStandardMaterial({ color: '#e9f3ff', emissive: '#cfe6ff', emissiveIntensity: 0.9, roughness: 0.1 }),
      tail: new THREE.MeshStandardMaterial({ color: '#7a0008', emissive: '#ff1a1a', emissiveIntensity: 0.7, roughness: 0.2 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#d9dde2', metalness: 1, roughness: 0.15 }),
      liner: new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.95 }),
    }),
    [],
  )
  const plateMat = useMemo(() => new THREE.MeshStandardMaterial({ map: makePlateTexture(), roughness: 0.4 }), [])

  const bodyY = cfg.height / 1000
  const { tireR } = wheelDims(cfg.rim)
  const wheelZ = W / 2 - 0.125 + cfg.track / 1000
  const camber = THREE.MathUtils.degToRad(cfg.camber)

  const zSide = spec.cabinWidth / 2 + 0.004
  const roofMidX = (c.roofF[0] + c.roofB[0]) / 2
  const roofMidY = (c.roofF[1] + c.roofB[1]) / 2
  const roofLen = Math.hypot(c.roofF[0] - c.roofB[0], c.roofF[1] - c.roofB[1])
  const roofAngle = Math.atan2(c.roofF[1] - c.roofB[1], c.roofF[0] - c.roofB[0])
  const roofYAt = (x) => c.roofF[1] + ((x - c.roofF[0]) / (c.roofB[0] - c.roofF[0])) * (c.roofB[1] - c.roofF[1])

  const frontX = spec.front + BEVEL
  const rearX = spec.rear - BEVEL
  const sideZ = W / 2 + 0.0015
  const isPicape = cfg.body === 'picape'
  const bed = spec.bed

  return (
    <group ref={ref} name="car-project">
      {/* ---------- carroceria (sobe/desce com a suspensão) ---------- */}
      <group position={[0, bodyY, 0]}>
        <mesh geometry={lowerGeo} material={paint} />
        <mesh geometry={cabinGeo} material={glass} />

        {/* teto e colunas */}
        <Box p={[roofMidX, roofMidY + GLASS_BEVEL - 0.002, 0]} r={[0, 0, roofAngle]} s={[roofLen + 0.04, 0.026, spec.cabinWidth + 0.008]} m={paint} />
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Strut a={c.start} b={c.roofF} z={sd * zSide} material={paint} />
            <Strut a={c.roofB} b={c.end} z={sd * zSide} material={paint} thick={isPicape ? 0.1 : 0.09} />
            {spec.bPillar !== null && <Strut a={[spec.bPillar, spec.belt]} b={[spec.bPillar - 0.02, roofYAt(spec.bPillar)]} z={sd * zSide} material={mats.black} thick={0.07} />}
            {/* frisos das portas e maçanetas */}
            <Box p={[spec.cowl - 0.02, (spec.sill + spec.belt) / 2 + 0.02, sd * sideZ]} s={[0.006, spec.belt - spec.sill - 0.08, 0.002]} m={mats.black} />
            {spec.bPillar !== null && (
              <>
                <Box p={[spec.bPillar, (spec.sill + spec.belt) / 2 + 0.02, sd * sideZ]} s={[0.006, spec.belt - spec.sill - 0.08, 0.002]} m={mats.black} />
                <Box p={[spec.bPillar - 0.12, spec.belt - 0.1, sd * (sideZ + 0.004)]} s={[0.12, 0.025, 0.01]} m={mats.black} />
              </>
            )}
            <Box p={[spec.cowl - 0.16, spec.belt - 0.1, sd * (sideZ + 0.004)]} s={[0.12, 0.025, 0.01]} m={mats.black} />
            {/* retrovisor */}
            <Box p={[spec.cowl - 0.1, spec.belt + 0.1, sd * (W / 2 + 0.07)]} s={[0.1, 0.09, 0.15]} m={paint} />
            <Box p={[spec.cowl - 0.08, spec.belt + 0.05, sd * (W / 2 - 0.02)]} s={[0.06, 0.03, 0.12]} m={mats.black} />
          </group>
        ))}

        {/* interior simples (aparece com insulfilm claro) */}
        <Box p={[c.start[0] - 0.25, spec.belt + 0.05, 0]} s={[0.3, 0.12, spec.cabinWidth - 0.1]} m={mats.interior} />
        {[-0.36, 0.36].map((z) => (
          <Box key={z} p={[(spec.bPillar ?? c.end[0] + 0.25) - 0.05, spec.belt + 0.18, z]} r={[0, 0, 0.18]} s={[0.12, 0.5, 0.48]} m={mats.interior} />
        ))}

        {/* frente: faróis, grade, placa */}
        {[-1, 1].map((sd) => (
          <Box key={sd} p={[spec.front - 0.01, spec.headY, sd * (W / 2 - 0.24)]} s={[0.12, 0.07, 0.32]} m={mats.head} />
        ))}
        <Box p={[spec.front + 0.005, spec.headY - 0.02, 0]} s={[0.14, 0.11, 0.62]} m={mats.gloss} />
        <Box p={[spec.front - 0.02, spec.sill + 0.16, 0]} s={[0.14, 0.09, W - 0.5]} m={mats.black} />
        <mesh material={plateMat} position={[frontX + 0.012, spec.sill + 0.27, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 0.13]} />
        </mesh>

        {/* traseira */}
        {!isPicape && (
          <>
            {[-1, 1].map((sd) => (
              <Box key={sd} p={[spec.rear, spec.tailY, sd * (W / 2 - 0.2)]} s={[0.15, 0.08, 0.3]} m={mats.tail} />
            ))}
            <mesh material={plateMat} position={[rearX - 0.012, spec.sill + 0.42, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.4, 0.13]} />
            </mesh>
            <Box p={[spec.rear + 0.02, spec.sill + 0.16, 0]} s={[0.14, 0.07, W - 0.3]} m={mats.black} />
          </>
        )}

        {/* caçamba da picape */}
        {isPicape && (
          <>
            {[-1, 1].map((sd) => (
              <group key={sd}>
                <Box p={[(bed.front + rearX) / 2, (bed.floor - 0.04 + bed.top) / 2, sd * (W / 2 - 0.04)]} s={[bed.front - rearX, bed.top - bed.floor + 0.04, 0.08]} m={paint} />
                <Box p={[rearX + 0.02, 0.86, sd * (W / 2 - 0.06)]} s={[0.06, 0.26, 0.11]} m={mats.tail} />
              </group>
            ))}
            <Box p={[rearX + 0.04, (bed.floor + bed.top) / 2, 0]} s={[0.07, bed.top - bed.floor, W - 0.24]} m={paint} />
            <Box p={[(bed.front + rearX) / 2, bed.floor + 0.005, 0]} s={[bed.front - rearX - 0.1, 0.01, W - 0.16]} m={mats.liner} />
            <mesh material={plateMat} position={[rearX - 0.012, 0.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.4, 0.13]} />
            </mesh>
            <Box p={[rearX + 0.02, spec.sill + 0.2, 0]} s={[0.16, 0.1, W - 0.2]} m={mats.chrome} />
          </>
        )}

        {/* aerofólio / santo antônio */}
        {cfg.spoiler && cfg.body === 'hatch' && (
          <Box p={[c.roofB[0] - 0.12, c.roofB[1] + 0.06, 0]} r={[0, 0, -0.12]} s={[0.36, 0.03, spec.cabinWidth + 0.04]} m={paint} />
        )}
        {cfg.spoiler && cfg.body === 'sedan' && (
          <>
            <Box p={[spec.rear + 0.2, 1.13, 0]} r={[0, 0, -0.08]} s={[0.26, 0.025, W - 0.16]} m={mats.gloss} />
            {[-0.5, 0.5].map((z) => (
              <Box key={z} p={[spec.rear + 0.22, 1.06, z]} s={[0.06, 0.13, 0.03]} m={mats.gloss} />
            ))}
          </>
        )}
        {cfg.spoiler && isPicape && (
          <group>
            {[-1, 1].map((sd) => (
              <mesh key={sd} material={mats.gloss} position={[bed.front - 0.12, 1.26, sd * (W / 2 - 0.08)]}>
                <cylinderGeometry args={[0.03, 0.03, 0.38, 16]} />
              </mesh>
            ))}
            <mesh material={mats.gloss} position={[bed.front - 0.12, 1.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, W - 0.1, 16]} />
            </mesh>
          </group>
        )}
      </group>

      {/* ---------- rodas (ficam no chão) ---------- */}
      {[spec.fa, spec.ra].map((x) =>
        [-1, 1].map((sd) => (
          <Wheel
            key={`${x}${sd}`}
            rim={cfg.rim}
            style={cfg.wheelStyle}
            rimColor={cfg.rimColor}
            caliper={cfg.caliper}
            side={sd}
            position={[x, tireR, sd * wheelZ]}
            rotation={[-sd * camber, 0, 0]}
          />
        )),
      )}
    </group>
  )
}
