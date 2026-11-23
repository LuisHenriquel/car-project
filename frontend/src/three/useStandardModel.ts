import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { BODY_NODE, GLASS_MATERIAL, PAINT_MATERIAL, WHEEL_SLOTS, type WheelSlot } from '../vehicles/standard'

export interface WheelMount {
  slot: WheelSlot
  x: number
  z: number
}

export interface StandardModel {
  /** Carroceria pronta para renderizar (sem as rodas do arquivo). */
  body: THREE.Object3D
  /** Onde ficam as rodas, lidas dos nós wheel_* do arquivo. */
  wheels: WheelMount[]
  /** Problemas encontrados no arquivo (o app continua funcionando). */
  issues: string[]
}

/**
 * Carrega um .glb no padrão do Car Project (docs/modelos-3d.md):
 *  - troca os materiais "paint" e "glass" pelos do configurador;
 *  - tira as rodas do arquivo e devolve a posição delas, para o app colocar as rodas escolhidas.
 */
export function useStandardModel(url: string, paint: THREE.Material, glass: THREE.Material): StandardModel {
  const gltf = useGLTF(url)

  // Estrutura (clonada uma vez por arquivo): posição das rodas e lista de problemas.
  const base = useMemo(() => {
    const scene = gltf.scene.clone(true)
    scene.updateMatrixWorld(true)
    const issues: string[] = []

    if (!scene.getObjectByName(BODY_NODE)) issues.push(`Nó "${BODY_NODE}" não encontrado`)

    const wheels: WheelMount[] = []
    for (const slot of WHEEL_SLOTS) {
      const node = scene.getObjectByName(slot)
      if (!node) {
        issues.push(`Nó "${slot}" não encontrado`)
        continue
      }
      const p = node.getWorldPosition(new THREE.Vector3())
      wheels.push({ slot, x: p.x, z: p.z })
      node.removeFromParent()
    }

    let hasPaint = false
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (list.some((m) => m.name === PAINT_MATERIAL)) hasPaint = true
    })
    if (!hasPaint) issues.push(`Nenhum material "${PAINT_MATERIAL}" (a cor não vai mudar)`)

    return { scene, wheels, issues }
  }, [gltf])

  // Aplica os materiais do configurador.
  const body = useMemo(() => {
    base.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const swap = (m: THREE.Material) =>
        m.name === PAINT_MATERIAL || m.userData.role === PAINT_MATERIAL
          ? tag(paint, PAINT_MATERIAL)
          : m.name === GLASS_MATERIAL || m.userData.role === GLASS_MATERIAL
            ? tag(glass, GLASS_MATERIAL)
            : m
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
    })
    return base.scene
  }, [base, paint, glass])

  return { body, wheels: base.wheels, issues: base.issues }
}

function tag(material: THREE.Material, role: string) {
  material.userData.role = role
  return material
}
