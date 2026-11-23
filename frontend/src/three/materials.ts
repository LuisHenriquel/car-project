import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { PaintFinish } from '../api/types'
import { FINISHES } from '../config/options'

/** Material da pintura. É aplicado em tudo que usa o material "paint" no modelo. */
export function usePaintMaterial(color: string, finish: PaintFinish) {
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({ name: 'paint', clearcoatRoughness: 0.08 }), [])
  useEffect(() => () => material.dispose(), [material])

  const f = FINISHES[finish]
  material.color.set(color)
  material.metalness = f.metalness
  material.roughness = f.roughness
  material.clearcoat = f.clearcoat
  material.iridescence = f.iridescence
  material.iridescenceIOR = 1.6
  material.iridescenceThicknessRange = [200, 700]
  return material
}

/** Material dos vidros. O insulfilm (0 a 100) controla a opacidade. */
export function useGlassMaterial(tint: number) {
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#0e151d', metalness: 0.1, roughness: 0.04, clearcoat: 1, transparent: true }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  material.opacity = 0.42 + (tint / 100) * 0.55
  return material
}
