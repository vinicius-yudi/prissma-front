# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instruções gerais

Sempre responda em português brasileiro, independentemente do idioma da pergunta.

Todas as decisões seguem: **DRY**, **KISS**, **YAGNI**. Nada é implementado sem necessidade clara do MVP.

## Comandos

```bash
bun --bun run dev       # Dev server na porta 3000
bun --bun run build     # Build de produção
bun --bun run test      # Testes com Vitest
bun --bun run check     # Lint + format com Biome
bun --bun run lint      # Lint apenas
bun --bun run format    # Format apenas
```

## Stack

Vite · React · TypeScript · TailwindCSS · TanStack Router

## Estrutura de pastas

```
src/
├── pages/        # features da aplicação
├── shared/       # código reutilizável entre páginas
├── assets/
├── styles/
└── main.tsx
```

### Pages (feature-based)

Cada página é uma pasta autocontida:

```
pages/
└── timer/
    ├── index.tsx
    ├── components/
    ├── hooks/
    ├── services/
    ├── utils/
    ├── types.ts
    └── README.md   ← síntese do módulo, obrigatório
```

### Shared

```
shared/
├── components/
├── hooks/
├── services/
├── utils/
├── types/
└── constants/
```

## Regras de dependência

- `shared` **nunca** importa nada de `pages`
- `pages` pode importar `shared`
- Código específico de uma feature **nunca** vai para `shared`
- Se é usado por apenas uma página, pertence à página

## Componentes

**UI Components**: apenas visual, Tailwind puro, zero regra de negócio.

**Container Components**: orquestram hooks, controlam estado, passam dados para UI.

Limite: ~150 linhas. Passou disso → quebre em componentes menores ou extraia para hooks.

## Hooks

- Toda lógica reutilizável vai para hooks
- Hooks não renderizam JSX
- Um hook = uma responsabilidade clara

## Services

- Toda comunicação externa (API, localStorage, browser APIs)
- Nenhum `fetch` direto em componentes
- Nenhuma lógica de UI

## Estado

MVP usa estado local e localStorage. **Proibido**: Redux, Zustand, qualquer state manager externo.

Context API é exceção, não padrão — só se mais de uma página consumir.

## Estilo de código

- Sem `any`
- Tipagem explícita sempre
- Early return como padrão
- Zero código morto
- Zero comentário explicando código óbvio

## Estilo visual

- TailwindCSS é a única fonte de estilo
- Sem CSS solto fora do Tailwind
- Tokens de design em `src/styles/` como CSS custom properties

## Configurações técnicas

**Roteamento**: TanStack Router com file-based routing em `src/routes/`. `routeTree.gen.ts` é auto-gerado — nunca editar manualmente.

**Path aliases**: `#/*` e `@/*` resolvem para `src/*`.

**Linting**: Biome (`biome.json`) — indentação com tab, aspas duplas em JS/TS. Ignora `routeTree.gen.ts` e `styles.css`.

**Tema**: toggle light/dark/auto salvo em `localStorage` com chave `theme`. Script inline em `__root.tsx` aplica o tema antes do paint para evitar flash.
