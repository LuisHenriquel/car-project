// Gera public/models/exemplo-hatch.glb: um carro de exemplo que segue o padrão
// de docs/modelos-3d.md. Serve de referência para quem for modelar e para testar o app.
//
//   npm run make-example-model

import { Document, NodeIO } from '@gltf-transform/core'
import * as THREE from 'three'
import {
  BEVEL, BEVEL_T, GLASS_BEVEL, GLASS_BEVEL_T, cabinShape, extrude, layoutFor, lowerShape,
} from '../src/three/placeholder/profiles.ts'

const specs = {
  lengthMm: 3880, widthMm: 1720, wheelbaseMm: 2520, frontAxleOffsetMm: 1220,
  wheelCenterHeightMm: 310, archRadiusMm: 370, groundClearanceMm: 165, stockRimInches: 15,
}
const layout = layoutFor('hatch', specs)

const doc = new Document()
const buffer = doc.createBuffer()
const scene = doc.createScene('car')

const paint = doc.createMaterial('paint').setBaseColorFactor([0.6, 0.05, 0.08, 1]).setMetallicFactor(0.6).setRoughnessFactor(0.35)
const glass = doc.createMaterial('glass').setBaseColorFactor([0.05, 0.07, 0.1, 0.7]).setAlphaMode('BLEND').setRoughnessFactor(0.05)
const tire = doc.createMaterial('tire').setBaseColorFactor([0.03, 0.03, 0.03, 1]).setRoughnessFactor(0.9)

/** Converte uma geometria do three.js em um mesh do glTF. */
function toMesh(name, geometry, material) {
  const g = geometry
  const prim = doc.createPrimitive().setMaterial(material)
  const pos = g.getAttribute('position')
  const nor = g.getAttribute('normal')
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos.array)).setBuffer(buffer))
  if (nor) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor.array)).setBuffer(buffer))
  if (g.index) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(g.index.array)).setBuffer(buffer))
  return doc.createMesh(name).addPrimitive(prim)
}

// Carroceria: lataria (paint) + vidros (glass)
const body = doc.createNode('body')
body.addChild(doc.createNode('shell').setMesh(toMesh('shell', extrude(lowerShape(layout), layout.width, BEVEL, BEVEL_T), paint)))
body.addChild(
  doc.createNode('windows').setMesh(
    toMesh('windows', extrude(cabinShape(layout.style.cabin), layout.style.cabin.width, GLASS_BEVEL, GLASS_BEVEL_T), glass),
  ),
)
scene.addChild(body)

// Rodas: nós vazios na posição de cada roda (o app troca pelas rodas escolhidas).
// Aqui colocamos um pneu simples dentro de cada um, só para o arquivo fazer sentido sozinho.
const tireGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32).rotateX(Math.PI / 2)
const tireMesh = toMesh('tire', tireGeo, tire)
const z = specs.widthMm / 2000 - 0.125
const wheels = {
  wheel_fl: [layout.frontAxle, -z],
  wheel_fr: [layout.frontAxle, z],
  wheel_rl: [layout.rearAxle, -z],
  wheel_rr: [layout.rearAxle, z],
}
for (const [name, [x, wz]] of Object.entries(wheels)) {
  const node = doc.createNode(name).setTranslation([x, specs.wheelCenterHeightMm / 1000, wz])
  node.addChild(doc.createNode(`${name}_tire`).setMesh(tireMesh))
  scene.addChild(node)
}

const out = new URL('../public/models/exemplo-hatch.glb', import.meta.url)
await new NodeIO().write(out.pathname, doc)
console.log(`Gerado: ${out.pathname}`)
