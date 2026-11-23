// Confere se um .glb segue o padrão do Car Project (docs/modelos-3d.md).
//
//   npm run validate-model -- public/models/meu-carro.glb

import { statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { NodeIO, getBounds } from '@gltf-transform/core'

const standard = JSON.parse(await readFile(new URL('../src/vehicles/model-standard.json', import.meta.url), 'utf8'))

const file = process.argv[2]
if (!file) {
  console.error('Uso: npm run validate-model -- caminho/do/modelo.glb')
  process.exit(2)
}

const errors = []
const warnings = []
const ok = []

const sizeMb = statSync(file).size / 1024 / 1024
if (sizeMb > standard.limits.maxFileSizeMb) {
  warnings.push(`Arquivo com ${sizeMb.toFixed(1)} MB (limite recomendado: ${standard.limits.maxFileSizeMb} MB)`)
}

const doc = await new NodeIO().read(file)
const root = doc.getRoot()
const scene = root.getDefaultScene() ?? root.listScenes()[0]
const nodes = root.listNodes()
const byName = new Map(nodes.map((n) => [n.getName(), n]))

// 1. Carroceria
if (byName.has(standard.nodes.body)) ok.push(`Nó "${standard.nodes.body}" encontrado`)
else errors.push(`Falta o nó "${standard.nodes.body}" (agrupe a carroceria dentro dele)`)

// 2. Rodas
const worldPos = (node) => node.getWorldMatrix().slice(12, 15)
const expected = { wheel_fl: [1, -1], wheel_fr: [1, 1], wheel_rl: [-1, -1], wheel_rr: [-1, 1] }
for (const slot of Object.keys(standard.nodes.wheels)) {
  const node = byName.get(slot)
  if (!node) {
    errors.push(`Falta o nó "${slot}" (${standard.nodes.wheels[slot]})`)
    continue
  }
  const [x, y, z] = worldPos(node)
  const [sx, sz] = expected[slot]
  if (Math.sign(x) !== sx || Math.sign(z) !== sz) {
    errors.push(`"${slot}" está no lugar errado (x=${x.toFixed(2)}, z=${z.toFixed(2)}). Frente = +X, direita = +Z.`)
  } else if (y < 0.2 || y > 0.5) {
    warnings.push(`"${slot}" está a ${y.toFixed(2)} m do chão; o esperado é o centro da roda (~0,30 m)`)
  } else {
    ok.push(`"${slot}" no lugar certo`)
  }
}

// 3. Materiais
const materials = root.listMaterials().map((m) => m.getName())
for (const [name, role] of Object.entries(standard.materials)) {
  if (materials.includes(name)) ok.push(`Material "${name}" encontrado`)
  else (name === 'paint' ? errors : warnings).push(`Falta o material "${name}" (${role})`)
}

// 4. Tamanho e origem (pega modelo em centímetros ou fora do chão)
const { min, max } = getBounds(scene)
const length = max[0] - min[0]
const height = max[1] - min[1]
const width = max[2] - min[2]
const dims = `${length.toFixed(2)} x ${width.toFixed(2)} x ${height.toFixed(2)} m (C x L x A)`
if (length < 2.5 || length > 6.5 || width < 1.3 || width > 2.5 || height < 0.9 || height > 2.8) {
  errors.push(`Medidas estranhas para um carro: ${dims}. Confira se está em metros e com a frente para +X.`)
} else {
  ok.push(`Medidas: ${dims}`)
}
if (Math.abs(min[1]) > 0.05) errors.push(`O ponto mais baixo está em y=${min[1].toFixed(2)} m; os pneus devem tocar o chão em y=0`)
const centerX = (max[0] + min[0]) / 2
const centerZ = (max[2] + min[2]) / 2
if (Math.abs(centerZ) > 0.05) warnings.push(`O carro não está centralizado na largura (z=${centerZ.toFixed(2)} m)`)
if (Math.abs(centerX) > 0.4) warnings.push(`O carro está deslocado no comprimento (x=${centerX.toFixed(2)} m)`)

// 5. Triângulos
let triangles = 0
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const count = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0
    triangles += count / 3
  }
}
if (triangles > standard.limits.maxTriangles) {
  warnings.push(`${Math.round(triangles).toLocaleString('pt-BR')} triângulos (limite recomendado: ${standard.limits.maxTriangles.toLocaleString('pt-BR')}). Pode ficar pesado no celular.`)
} else {
  ok.push(`${Math.round(triangles).toLocaleString('pt-BR')} triângulos`)
}

console.log(`\nValidando ${file}\n`)
for (const m of ok) console.log(`  ✔ ${m}`)
for (const m of warnings) console.log(`  ⚠ ${m}`)
for (const m of errors) console.log(`  ✖ ${m}`)
console.log(errors.length ? `\n${errors.length} erro(s): o modelo não está no padrão.\n` : '\nModelo no padrão.\n')
process.exit(errors.length ? 1 : 0)
