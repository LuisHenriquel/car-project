import { Suspense, type Ref } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import type { ProjectConfig, Vehicle } from '../api/types'
import VehicleModel from './VehicleModel'

interface Props {
  vehicle: Vehicle
  config: ProjectConfig
  carRef: Ref<THREE.Group>
  canvasRef: Ref<HTMLCanvasElement>
  onIssues: (issues: string[]) => void
}

/** Cena 3D: luz de estúdio, chão com sombra e câmera orbitando o carro. */
export default function Stage({ vehicle, config, carRef, canvasRef, onIssues }: Props) {
  return (
    <Canvas
      ref={canvasRef}
      dpr={[1, 2]}
      camera={{ position: [5.2, 2.1, 5.6], fov: 34 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={['#15181d']} />
      <fog attach="fog" args={['#15181d', 14, 30]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 4]} intensity={1.6} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, -1]} rotation-y={-Math.PI / 2} scale={[12, 2, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <VehicleModel key={vehicle.slug} vehicle={vehicle} config={config} ref={carRef} onIssues={onIssues} />
      </Suspense>

      <ContactShadows position={[0, 0.002, 0]} opacity={0.75} scale={9} blur={2.4} far={2.5} resolution={512} />
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#1c2026" roughness={0.95} />
      </mesh>
      <OrbitControls target={[0, 0.65, 0]} enablePan={false} minDistance={3.4} maxDistance={11} maxPolarAngle={Math.PI / 2 - 0.04} makeDefault />
    </Canvas>
  )
}
