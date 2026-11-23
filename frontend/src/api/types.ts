// Tipos iguais aos DTOs do backend (backend/src/CarProject.Api/Contracts).
// Se mudar um campo lá, mude aqui também.

export type BodyType = 'hatch' | 'sedan' | 'pickup'

export interface VehicleSpecs {
  lengthMm: number
  widthMm: number
  wheelbaseMm: number
  /** Distância do eixo dianteiro até o centro do carro (positivo = para frente). */
  frontAxleOffsetMm: number
  wheelCenterHeightMm: number
  archRadiusMm: number
  groundClearanceMm: number
  stockRimInches: number
}

export interface Vehicle {
  id: number
  slug: string
  name: string
  brand: string | null
  bodyType: BodyType
  /** Arquivo .glb no padrão do Car Project. null = carro simples (placeholder). */
  modelUrl: string | null
  specs: VehicleSpecs
}

export type PaintFinish = 'solid' | 'metallic' | 'pearl' | 'matte'
export type WheelStyle = 'five-spoke' | 'multi-spoke' | 'mesh' | 'dish'
export type RimColor = 'silver' | 'graphite' | 'black' | 'bronze' | 'gold' | 'white'

export interface ProjectConfig {
  paintColor: string
  paintFinish: PaintFinish
  wheelStyle: WheelStyle
  rimColor: RimColor
  rimInches: number
  caliperColor: string
  /** mm, negativo = rebaixado */
  rideHeightMm: number
  camberDeg: number
  /** mm para fora */
  trackMm: number
  /** 0 a 100 */
  windowTint: number
}

export interface Project {
  id: string
  name: string
  vehicleSlug: string
  config: ProjectConfig
  createdAt: string
  updatedAt: string
}

export interface SaveProjectRequest {
  name: string
  vehicleSlug: string
  config: ProjectConfig
}
