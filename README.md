# Car Project

App para montar o projeto do seu carro (rodas, aro, pintura, suspensão…), ver em 3D e em realidade aumentada.

> **Status:** código inicial. O primeiro protótipo está guardado na branch [`prototipo`](../../tree/prototipo), só como referência.

## Decisões

| Área | Escolha |
|---|---|
| Backend | C# — ASP.NET Core (.NET 10) + Entity Framework Core |
| Frontend | React + TypeScript (Vite) |
| 3D e AR | Three.js (React Three Fiber) + `<model-viewer>` do Google para o AR |
| Banco de dados | PostgreSQL |
| Hospedagem | AWS |
| Modelos 3D | Carros genéricos na 1ª versão, no [padrão do projeto](docs/modelos-3d.md) |

## Estrutura

```
backend/                     API em C#
  src/CarProject.Api/
    Domain/                  entidades (Vehicle, Project)
    Data/                    DbContext do EF Core e carros iniciais (SeedData)
    Contracts/               DTOs da API
    Controllers/             /api/vehicles e /api/projects
frontend/                    React + TypeScript
  src/
    api/                     cliente e tipos da API
    three/                   cena 3D, rodas, carro simples e leitor de .glb
    vehicles/                padrão dos modelos, encaixe (fitment), carros locais
    components/              painel do configurador e tela de AR
  public/models/             arquivos .glb dos carros
  scripts/                   validador de modelos e gerador do exemplo
tools/blender/               script para conferir e exportar modelos no Blender
docs/modelos-3d.md           padrão dos modelos 3D e como adicionar um carro
docker-compose.yml           PostgreSQL local
```

## Como rodar

Precisa de: [.NET 10 SDK](https://dotnet.microsoft.com/download), [Node.js 22+](https://nodejs.org) e [Docker](https://www.docker.com/) (para o PostgreSQL).

**1. Banco de dados**
```bash
docker compose up -d
```

**2. Backend** (http://localhost:5080)
```bash
cd backend
dotnet run --project src/CarProject.Api
```
Em desenvolvimento a API cria as tabelas e os carros iniciais sozinha. Exemplos de chamadas em [`CarProject.Api.http`](backend/src/CarProject.Api/CarProject.Api.http).

**3. Frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
O frontend funciona mesmo sem o backend: usa os carros locais e só não salva projetos. A bolinha ao lado do logo mostra se a API está conectada (verde) ou não (amarela).

## API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/vehicles` | Lista os carros do catálogo |
| GET | `/api/vehicles/{slug}` | Um carro |
| GET | `/api/projects/{id}` | Abre um projeto salvo |
| POST | `/api/projects` | Salva um projeto novo |
| PUT | `/api/projects/{id}` | Atualiza um projeto |
| DELETE | `/api/projects/{id}` | Apaga um projeto |
| GET | `/health` | Saúde da API e do banco |

A configuração do projeto (cor, rodas, altura…) fica numa coluna **JSONB** no PostgreSQL.

## Adicionar um carro novo

Veja [docs/modelos-3d.md](docs/modelos-3d.md). Resumo: modelar no padrão → `npm run validate-model` → cadastrar no `SeedData.cs`.

## Próximos passos

- [ ] Migrations do EF Core (`dotnet ef migrations add Inicial`) no lugar do `EnsureCreated`
- [ ] Testes do backend e do frontend
- [ ] Login e "minha garagem"
- [ ] Catálogo de peças reais com medidas e compatibilidade
- [ ] Primeiros modelos 3D genéricos de qualidade
- [ ] Deploy na AWS
