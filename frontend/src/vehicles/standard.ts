import standard from './model-standard.json'

/** Nomes obrigatórios dentro do .glb (ver docs/modelos-3d.md). */
export const MODEL_STANDARD = standard

export const BODY_NODE = standard.nodes.body

export type WheelSlot = 'wheel_fl' | 'wheel_fr' | 'wheel_rl' | 'wheel_rr'
export const WHEEL_SLOTS = Object.keys(standard.nodes.wheels) as WheelSlot[]

export const PAINT_MATERIAL = 'paint'
export const GLASS_MATERIAL = 'glass'
