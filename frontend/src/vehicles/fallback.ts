import type { Vehicle } from '../api/types'

/**
 * Mesmos carros do SeedData do backend. Usados quando a API não está rodando,
 * para dar para mexer no frontend sozinho.
 */
export const FALLBACK_VEHICLES: Vehicle[] = [
  {
    id: 1,
    slug: 'hatch-generico',
    name: 'Hatch genérico',
    brand: null,
    bodyType: 'hatch',
    modelUrl: '/models/hatch-generico.glb',
    specs: {
      lengthMm: 3880, widthMm: 1720, wheelbaseMm: 2520, frontAxleOffsetMm: 1220,
      wheelCenterHeightMm: 310, archRadiusMm: 370, groundClearanceMm: 165, stockRimInches: 15,
    },
  },
  {
    id: 2,
    slug: 'seda-generico',
    name: 'Sedã genérico',
    brand: null,
    bodyType: 'sedan',
    modelUrl: null,
    specs: {
      lengthMm: 4360, widthMm: 1760, wheelbaseMm: 2680, frontAxleOffsetMm: 1320,
      wheelCenterHeightMm: 310, archRadiusMm: 370, groundClearanceMm: 155, stockRimInches: 16,
    },
  },
  {
    id: 3,
    slug: 'picape-generica',
    name: 'Picape genérica',
    brand: null,
    bodyType: 'pickup',
    modelUrl: null,
    specs: {
      lengthMm: 4500, widthMm: 1800, wheelbaseMm: 2840, frontAxleOffsetMm: 1420,
      wheelCenterHeightMm: 310, archRadiusMm: 370, groundClearanceMm: 205, stockRimInches: 15,
    },
  },
]
