import { useEffect, type ReactNode, type Ref } from 'react'
import * as THREE from 'three'
import type { ProjectConfig, Vehicle } from '../api/types'
import { wheelCenterZ, wheelDims } from '../vehicles/fitment'
import { useGlassMaterial, usePaintMaterial } from './materials'
import PlaceholderBody from './placeholder/PlaceholderBody'
import { useStandardModel, type WheelMount } from './useStandardModel'
import Wheel from './Wheel'

interface Props {
  vehicle: Vehicle
  config: ProjectConfig
  ref?: Ref<THREE.Group>
  onIssues?: (issues: string[]) => void
}

/**
 * Monta o carro: carroceria (do .glb ou o carro simples) + as rodas escolhidas.
 * A carroceria sobe/desce com a suspensão; as rodas ficam no chão.
 */
export default function VehicleModel({ vehicle, config, ref, onIssues }: Props) {
  const paint = usePaintMaterial(config.paintColor, config.paintFinish)
  const glass = useGlassMaterial(config.windowTint)

  return (
    <group ref={ref} name="car-project">
      {vehicle.modelUrl ? (
        <GlbVehicle url={vehicle.modelUrl} vehicle={vehicle} config={config} paint={paint} glass={glass} onIssues={onIssues} />
      ) : (
        <Rig vehicle={vehicle} config={config} wheels={placeholderWheels(vehicle)}>
          <PlaceholderBody bodyType={vehicle.bodyType} specs={vehicle.specs} paint={paint} glass={glass} />
        </Rig>
      )}
    </group>
  )
}

function GlbVehicle({
  url, vehicle, config, paint, glass, onIssues,
}: { url: string; vehicle: Vehicle; config: ProjectConfig; paint: THREE.Material; glass: THREE.Material; onIssues?: (issues: string[]) => void }) {
  const model = useStandardModel(url, paint, glass)
  useEffect(() => onIssues?.(model.issues), [model.issues, onIssues])

  // Se o arquivo não marcar as rodas, usa as medidas do catálogo.
  const wheels = model.wheels.length === 4 ? model.wheels : placeholderWheels(vehicle)
  return (
    <Rig vehicle={vehicle} config={config} wheels={wheels}>
      <primitive object={model.body} />
    </Rig>
  )
}

function Rig({ vehicle, config, wheels, children }: { vehicle: Vehicle; config: ProjectConfig; wheels: WheelMount[]; children: ReactNode }) {
  const { tireR } = wheelDims(config.rimInches)
  // Diferença entre a roda do arquivo e a posição original, mais o "roda para fora".
  const baseZ = wheelCenterZ(vehicle.specs, { ...config, trackMm: 0 })

  return (
    <>
      <group position={[0, config.rideHeightMm / 1000, 0]}>{children}</group>
      {wheels.map((w) => {
        const side = w.z >= 0 ? 1 : -1
        const z = side * (Math.abs(w.z) || baseZ) + side * (config.trackMm / 1000)
        return (
          <Wheel
            key={w.slot}
            rimInches={config.rimInches}
            style={config.wheelStyle}
            rimColor={config.rimColor}
            caliperColor={config.caliperColor}
            side={side}
            position={[w.x, tireR, z]}
            camberDeg={config.camberDeg}
          />
        )
      })}
    </>
  )
}

function placeholderWheels(vehicle: Vehicle): WheelMount[] {
  const s = vehicle.specs
  const fa = s.frontAxleOffsetMm / 1000
  const ra = fa - s.wheelbaseMm / 1000
  const z = s.widthMm / 2000 - 0.125
  return [
    { slot: 'wheel_fl', x: fa, z: -z },
    { slot: 'wheel_fr', x: fa, z },
    { slot: 'wheel_rl', x: ra, z: -z },
    { slot: 'wheel_rr', x: ra, z },
  ]
}
