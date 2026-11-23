// Medidas e cálculos de encaixe (fitment). Unidades em metros.

export const WHEEL_CENTER = 0.31 // altura original do centro da roda
export const ARCH_R = 0.37 // raio efetivo da caixa de roda
export const TIRE_WIDTH = 0.205 // pneu 205 mm

// Plus-size: aro maior com pneu de perfil mais baixo, diâmetro total cresce pouco.
export function wheelDims(rim) {
  const rimR = (rim * 0.0254) / 2
  const tireR = 0.298 + (rim - 14) * 0.0058
  return { rimR, tireR }
}

export function tireLabel(rim) {
  const { rimR, tireR } = wheelDims(rim)
  const sidewall = (tireR - rimR) * 1000
  const aspect = Math.max(25, Math.round(((sidewall / 205) * 100) / 5) * 5)
  return `205/${aspect} R${rim}`
}

/**
 * Verifica o encaixe da roda e da suspensão e devolve alertas.
 * @param {object} cfg configuração atual
 * @param {object} body especificação da carroceria (width, sill)
 */
export function checkFitment(cfg, body) {
  const h = cfg.height / 1000
  const { tireR } = wheelDims(cfg.rim)
  const archCenterY = WHEEL_CENTER + h
  const dy = Math.abs(archCenterY - tireR)
  const archGap = ARCH_R - dy - tireR // folga entre pneu e para-lama
  const groundClearance = (body.sill + h) * 100 // cm

  const tireOuterZ = body.width / 2 - 0.125 + cfg.track / 1000 + TIRE_WIDTH / 2
  const poke = (tireOuterZ - body.width / 2) * 1000 // mm além do para-lama

  const warnings = []
  if (archGap < 0) {
    warnings.push({ level: 'danger', text: 'O pneu encosta no para-lama. Diminua o aro ou suba a suspensão.' })
  } else if (archGap < 0.015) {
    warnings.push({ level: 'warn', text: 'Folga muito justa: pode raspar em lombadas e buracos.' })
  }
  if (groundClearance < 10) {
    warnings.push({ level: 'danger', text: `Vão livre de ${groundClearance.toFixed(0)} cm: vai raspar em lombadas e valetas.` })
  } else if (groundClearance < 13) {
    warnings.push({ level: 'warn', text: `Vão livre baixo (${groundClearance.toFixed(0)} cm): cuidado com lombadas.` })
  }
  if (poke > 5) {
    warnings.push({ level: 'warn', text: `Roda ${poke.toFixed(0)} mm para fora do para-lama: pode dar problema em vistoria.` })
  }
  if (cfg.camber >= 5) {
    warnings.push({ level: 'warn', text: `Cambagem de ${cfg.camber}°: desgaste rápido e irregular dos pneus.` })
  }
  if (cfg.tint >= 80) {
    warnings.push({ level: 'warn', text: 'Insulfilm muito escuro: confira o limite permitido para cada vidro.' })
  }

  return {
    archGapMm: Math.round(archGap * 1000),
    groundClearance: Math.round(groundClearance),
    poke: Math.round(poke),
    tire: tireLabel(cfg.rim),
    warnings,
  }
}
