import type { PaintFinish, ProjectConfig, RimColor, WheelStyle } from '../api/types'

export const BODY_LABELS = { hatch: 'Hatch', sedan: 'Sedã', pickup: 'Picape' } as const

export const PAINT_COLORS = [
  { name: 'Vermelho', hex: '#b3121b' },
  { name: 'Preto', hex: '#0c0d10' },
  { name: 'Branco', hex: '#eef0f2' },
  { name: 'Prata', hex: '#a9afb7' },
  { name: 'Cinza grafite', hex: '#4a4f57' },
  { name: 'Azul', hex: '#1d4fa3' },
  { name: 'Verde', hex: '#1f6b45' },
  { name: 'Amarelo', hex: '#f2c230' },
  { name: 'Laranja', hex: '#ef6a1f' },
  { name: 'Roxo', hex: '#5b2a86' },
]

export interface FinishSpec {
  label: string
  metalness: number
  roughness: number
  clearcoat: number
  iridescence: number
}

export const FINISHES: Record<PaintFinish, FinishSpec> = {
  solid: { label: 'Sólida', metalness: 0.05, roughness: 0.35, clearcoat: 1, iridescence: 0 },
  metallic: { label: 'Metálica', metalness: 0.65, roughness: 0.32, clearcoat: 1, iridescence: 0 },
  pearl: { label: 'Perolizada', metalness: 0.35, roughness: 0.25, clearcoat: 1, iridescence: 0.7 },
  matte: { label: 'Fosca', metalness: 0.15, roughness: 0.78, clearcoat: 0, iridescence: 0 },
}

export const WHEEL_STYLES: Record<WheelStyle, string> = {
  'five-spoke': '5 raios',
  'multi-spoke': 'Multirraios',
  mesh: 'Tela (cruzada)',
  dish: 'Disco furado',
}

export interface RimColorSpec {
  label: string
  hex: string
  metalness: number
  roughness: number
}

export const RIM_COLORS: Record<RimColor, RimColorSpec> = {
  silver: { label: 'Prata', hex: '#cfd3d8', metalness: 1, roughness: 0.22 },
  graphite: { label: 'Grafite', hex: '#3d4249', metalness: 0.9, roughness: 0.3 },
  black: { label: 'Preta fosca', hex: '#121314', metalness: 0.3, roughness: 0.65 },
  bronze: { label: 'Bronze', hex: '#8a6538', metalness: 1, roughness: 0.3 },
  gold: { label: 'Dourada', hex: '#c9a24c', metalness: 1, roughness: 0.25 },
  white: { label: 'Branca', hex: '#f1f1f1', metalness: 0.1, roughness: 0.3 },
}

export const CALIPER_COLORS = [
  { name: 'Original', hex: '#555a60' },
  { name: 'Vermelha', hex: '#d0241b' },
  { name: 'Amarela', hex: '#f0c419' },
  { name: 'Azul', hex: '#1e63d6' },
]

export const RIM_SIZES = [14, 15, 16, 17, 18, 19, 20]

export const DEFAULT_CONFIG: ProjectConfig = {
  paintColor: '#b3121b',
  paintFinish: 'metallic',
  wheelStyle: 'five-spoke',
  rimColor: 'silver',
  rimInches: 16,
  caliperColor: '#555a60',
  rideHeightMm: 0,
  camberDeg: 0,
  trackMm: 0,
  windowTint: 50,
}
