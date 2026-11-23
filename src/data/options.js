// Catálogo de opções do configurador.

export const BODY_TYPES = {
  hatch: 'Hatch',
  sedan: 'Sedã',
  picape: 'Picape',
}

// Modelos populares no Brasil mapeados para a carroceria base.
// Por enquanto cada um usa o modelo 3D genérico da carroceria;
// o plano é ter o modelo 3D específico de cada carro (ver README).
export const CATALOG = [
  { name: 'Chevrolet Onix', body: 'hatch' },
  { name: 'Chevrolet Onix Plus', body: 'sedan' },
  { name: 'Chevrolet Celta', body: 'hatch' },
  { name: 'Chevrolet Montana', body: 'picape' },
  { name: 'Chevrolet S10', body: 'picape' },
  { name: 'Hyundai HB20', body: 'hatch' },
  { name: 'Hyundai HB20S', body: 'sedan' },
  { name: 'Volkswagen Gol', body: 'hatch' },
  { name: 'Volkswagen Polo', body: 'hatch' },
  { name: 'Volkswagen Virtus', body: 'sedan' },
  { name: 'Volkswagen Jetta', body: 'sedan' },
  { name: 'Volkswagen Saveiro', body: 'picape' },
  { name: 'Volkswagen Amarok', body: 'picape' },
  { name: 'Fiat Mobi', body: 'hatch' },
  { name: 'Fiat Argo', body: 'hatch' },
  { name: 'Fiat Uno', body: 'hatch' },
  { name: 'Fiat Palio', body: 'hatch' },
  { name: 'Fiat Cronos', body: 'sedan' },
  { name: 'Fiat Strada', body: 'picape' },
  { name: 'Fiat Toro', body: 'picape' },
  { name: 'Renault Kwid', body: 'hatch' },
  { name: 'Renault Sandero', body: 'hatch' },
  { name: 'Renault Logan', body: 'sedan' },
  { name: 'Peugeot 208', body: 'hatch' },
  { name: 'Ford Ka', body: 'hatch' },
  { name: 'Ford Ka Sedan', body: 'sedan' },
  { name: 'Ford Ranger', body: 'picape' },
  { name: 'Toyota Corolla', body: 'sedan' },
  { name: 'Toyota Yaris', body: 'hatch' },
  { name: 'Toyota Hilux', body: 'picape' },
  { name: 'Honda Civic', body: 'sedan' },
  { name: 'Honda City', body: 'sedan' },
  { name: 'Honda Fit', body: 'hatch' },
  { name: 'Nissan Versa', body: 'sedan' },
  { name: 'Nissan Frontier', body: 'picape' },
  { name: 'Mitsubishi L200', body: 'picape' },
]

export const PAINT_COLORS = [
  { name: 'Vermelho', hex: '#b3121b' },
  { name: 'Preto', hex: '#0c0d10' },
  { name: 'Branco', hex: '#eef0f2' },
  { name: 'Prata', hex: '#a9afb7' },
  { name: 'Cinza grafite', hex: '#4a4f57' },
  { name: 'Cinza cimento', hex: '#8a8f8c' },
  { name: 'Azul', hex: '#1d4fa3' },
  { name: 'Azul bebê', hex: '#8fc3e8' },
  { name: 'Verde', hex: '#1f6b45' },
  { name: 'Verde limão', hex: '#9bd12a' },
  { name: 'Amarelo', hex: '#f2c230' },
  { name: 'Laranja', hex: '#ef6a1f' },
  { name: 'Roxo', hex: '#5b2a86' },
  { name: 'Rosa', hex: '#e46aa0' },
]

// metalness / roughness / clearcoat / iridescence por tipo de acabamento
export const FINISHES = {
  solida: { label: 'Sólida', metalness: 0.05, roughness: 0.35, clearcoat: 1, iridescence: 0 },
  metalica: { label: 'Metálica', metalness: 0.65, roughness: 0.32, clearcoat: 1, iridescence: 0 },
  perolizada: { label: 'Perolizada', metalness: 0.35, roughness: 0.25, clearcoat: 1, iridescence: 0.7 },
  fosca: { label: 'Fosca', metalness: 0.15, roughness: 0.78, clearcoat: 0, iridescence: 0 },
}

export const WHEEL_STYLES = {
  esportiva: '5 raios',
  multiraios: 'Multirraios',
  tela: 'Tela (cruzada)',
  disco: 'Disco furado',
}

export const RIM_COLORS = {
  prata: { label: 'Prata', hex: '#cfd3d8', metalness: 1, roughness: 0.22 },
  grafite: { label: 'Grafite', hex: '#3d4249', metalness: 0.9, roughness: 0.3 },
  preta: { label: 'Preta fosca', hex: '#121314', metalness: 0.3, roughness: 0.65 },
  bronze: { label: 'Bronze', hex: '#8a6538', metalness: 1, roughness: 0.3 },
  dourada: { label: 'Dourada', hex: '#c9a24c', metalness: 1, roughness: 0.25 },
  branca: { label: 'Branca', hex: '#f1f1f1', metalness: 0.1, roughness: 0.3 },
}

export const CALIPER_COLORS = [
  { name: 'Original', hex: '#555a60' },
  { name: 'Vermelha', hex: '#d0241b' },
  { name: 'Amarela', hex: '#f0c419' },
  { name: 'Azul', hex: '#1e63d6' },
  { name: 'Verde', hex: '#2fa84f' },
]

export const RIM_SIZES = [14, 15, 16, 17, 18, 19, 20]

export const DEFAULT_CONFIG = {
  body: 'hatch',
  model: '',
  paint: '#b3121b',
  finish: 'metalica',
  wheelStyle: 'esportiva',
  rimColor: 'prata',
  rim: 16,
  caliper: '#555a60',
  height: 0, // mm (negativo = rebaixado)
  camber: 0, // graus
  track: 0, // mm para fora
  tint: 50, // % de escurecimento do insulfilm
  spoiler: false,
}
