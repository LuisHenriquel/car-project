# Padrão dos modelos 3D

Todo carro do Car Project é um arquivo **.glb** que segue as regras abaixo. Seguindo o padrão, o app troca a pintura, coloca as rodas escolhidas e mexe na suspensão de qualquer carro sem código novo.

As regras também estão em [`frontend/src/vehicles/model-standard.json`](../frontend/src/vehicles/model-standard.json), que o app e o validador leem.

## Regras

| Regra | Valor |
|---|---|
| Formato | `.glb` (glTF binário) |
| Unidade | **metros** (um hatch tem ~3,9 m de comprimento) |
| Eixos (glTF) | frente do carro = **+X**, cima = **+Y**, lado direito = **+Z** |
| Eixos (no Blender) | frente = **+X**, cima = **+Z**, lado direito = **−Y** (o exportador converte) |
| Origem | no **chão**, no centro do carro. Os pneus tocam y = 0 |
| Tamanho | até ~300 mil triângulos e 15 MB (para abrir bem no celular) |

### Nomes obrigatórios

| Nome | O que é |
|---|---|
| `body` | Objeto/grupo com toda a carroceria (lataria, vidros, faróis, interior). Sobe e desce com a suspensão. |
| `wheel_fl` | Centro da roda **dianteira esquerda** |
| `wheel_fr` | Centro da roda **dianteira direita** |
| `wheel_rl` | Centro da roda **traseira esquerda** |
| `wheel_rr` | Centro da roda **traseira direita** |

Os `wheel_*` podem ser objetos vazios (Empty) ou conter o pneu original. **O app remove o que estiver dentro deles** e coloca as rodas do configurador na mesma posição.

### Materiais

| Material | O que o app faz |
|---|---|
| `paint` | Troca pela cor e acabamento escolhidos. Use em toda a lataria que leva a cor do carro. |
| `glass` | Troca pelo vidro com insulfilm. |
| outros | Ficam como estão (plásticos pretos, cromados, faróis, borrachas…). |

## Como adicionar um carro novo

1. **Modele ou importe** o carro no Blender seguindo as regras acima (ou gere pelo script, abaixo).
   - Rodas e carroceria separadas, com os nomes da tabela.
   - Para conferir e exportar, use o script [`tools/blender/exportar_modelo.py`](../tools/blender/exportar_modelo.py):
     ```bash
     blender meu-carro.blend --background --python tools/blender/exportar_modelo.py -- frontend/public/models/meu-carro.glb
     ```
   - Com o **Blender MCP** ligado ao Claude, dá para pedir para ele montar, renomear e exportar seguindo este documento.
2. **Valide** o arquivo:
   ```bash
   cd frontend
   npm run validate-model -- public/models/meu-carro.glb
   ```
3. **Cadastre** o carro em [`backend/src/CarProject.Api/Data/SeedData.cs`](../backend/src/CarProject.Api/Data/SeedData.cs) com `ModelUrl = "/models/meu-carro.glb"` e as medidas reais (entre-eixos, largura, vão livre…).
   Se quiser testar sem o backend, adicione também em [`frontend/src/vehicles/fallback.ts`](../frontend/src/vehicles/fallback.ts).
4. Rode o app e escolha o carro na lista. Se algo estiver fora do padrão, aparece um aviso em cima do carro.

> Os arquivos ficam em `frontend/public/models/` por enquanto. Quando formos para a AWS, vão para o S3 e o `ModelUrl` passa a ser a URL de lá.

## Carros genéricos gerados por script

Os carros genéricos são gerados direto no Blender por [`tools/blender/gerar_carro.py`](../tools/blender/gerar_carro.py), já no padrão. Funciona com o Blender instalado ou só com o módulo Python dele (`pip install bpy`):

```bash
# gera o .glb (e um .blend ao lado, para abrir e ajustar no Blender)
python tools/blender/gerar_carro.py hatch frontend/public/models/hatch-generico.glb

# imagens de conferência (frente, traseira e lado)
python tools/blender/render_preview.py frontend/public/models/hatch-generico.blend /tmp/hatch
```

| Carro | Arquivo | Situação |
|---|---|---|
| Hatch | `frontend/public/models/hatch-generico.glb` | pronto |
| Sedã | — | carro simples do app (placeholder) |
| Picape | — | carro simples do app (placeholder) |

Cada carro é uma `CarSpec` no começo do script: silhueta lateral, largura, eixos, linha das janelas, posição dos faróis etc. Para criar outro, copie uma `CarSpec` e ajuste.

## Licença dos modelos

Antes de usar um modelo baixado, confira a licença:
- **CC0**: pode usar livremente.
- **CC-BY**: pode usar, mas precisa dar crédito ao autor.
- **Editorial**: não pode em projeto comercial.
- Carros de **marcas reais** (logo, nome e formato) podem ter direitos da montadora: na primeira versão usamos só carros genéricos.
