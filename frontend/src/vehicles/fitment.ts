import type { ProjectConfig, VehicleSpecs } from '../api/types'

/** Largura do pneu em metros (205 mm). */
export const TIRE_WIDTH = 0.205

/** Distância da face externa do para-lama até o centro da roda, original (m). */
const WHEEL_INSET = 0.125

/** Raio da roda (aro) e do pneu em metros. Aro maior = perfil mais baixo. */
export function wheelDims(rimInches: number) {
  const rimR = (rimInches * 0.0254) / 2
  const tireR = 0.298 + (rimInches - 14) * 0.0058
  return { rimR, tireR }
}

export function tireLabel(rimInches: number) {
  const { rimR, tireR } = wheelDims(rimInches)
  const sidewallMm = (tireR - rimR) * 1000
  const aspect = Math.max(25, Math.round((sidewallMm / 205) * 20) * 5)
  return `205/${aspect} R${rimInches}`
}

/** Posição Z do centro da roda (lado direito; o esquerdo é o negativo). */
export function wheelCenterZ(specs: VehicleSpecs, config: ProjectConfig) {
  return specs.widthMm / 2000 - WHEEL_INSET + config.trackMm / 1000
}

export interface FitmentWarning {
  level: 'warn' | 'danger'
  text: string
}

export interface FitmentResult {
  tire: string
  groundClearanceCm: number
  archGapMm: number
  pokeMm: number
  warnings: FitmentWarning[]
}

/** Confere se a combinação de roda + suspensão cabe no carro. */
export function checkFitment(specs: VehicleSpecs, config: ProjectConfig): FitmentResult {
  const h = config.rideHeightMm / 1000
  const { tireR } = wheelDims(config.rimInches)
  const archCenterY = specs.wheelCenterHeightMm / 1000 + h
  const archGap = specs.archRadiusMm / 1000 - Math.abs(archCenterY - tireR) - tireR
  const groundClearanceCm = specs.groundClearanceMm / 10 + config.rideHeightMm / 10
  const pokeMm = (wheelCenterZ(specs, config) + TIRE_WIDTH / 2 - specs.widthMm / 2000) * 1000

  const warnings: FitmentWarning[] = []
  if (archGap < 0) {
    warnings.push({ level: 'danger', text: 'O pneu encosta no para-lama. Diminua o aro ou suba a suspensão.' })
  } else if (archGap < 0.015) {
    warnings.push({ level: 'warn', text: 'Folga muito justa: pode raspar em lombadas e buracos.' })
  }
  if (groundClearanceCm < 10) {
    warnings.push({ level: 'danger', text: `Vão livre de ${groundClearanceCm.toFixed(0)} cm: vai raspar em lombadas e valetas.` })
  } else if (groundClearanceCm < 13) {
    warnings.push({ level: 'warn', text: `Vão livre baixo (${groundClearanceCm.toFixed(0)} cm): cuidado com lombadas.` })
  }
  if (pokeMm > 5) {
    warnings.push({ level: 'warn', text: `Roda ${pokeMm.toFixed(0)} mm para fora do para-lama: pode dar problema em vistoria.` })
  }
  if (config.camberDeg >= 5) {
    warnings.push({ level: 'warn', text: `Cambagem de ${config.camberDeg}°: desgaste rápido e irregular dos pneus.` })
  }

  return {
    tire: tireLabel(config.rimInches),
    groundClearanceCm: Math.round(groundClearanceCm),
    archGapMm: Math.round(archGap * 1000),
    pokeMm: Math.round(pokeMm),
    warnings,
  }
}
