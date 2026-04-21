# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instruções gerais

Sempre responda em português brasileiro, independentemente do idioma da pergunta.

Todas as decisões seguem: **DRY**, **KISS**, **YAGNI**. Nada é implementado sem necessidade clara do MVP.

## Comandos

```bash
bun --bun run dev       # Dev server na porta 3000
bun --bun run build     # Build de produção
bun --bun run lint      # Lint apenas
```

## Stack

Vite · React · TypeScript · TailwindCSS · React Router DOM · TanStack Query

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
    └── types.ts
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
- Zero comentário de código — código deve ser autoexplicativo
- Nunca usar `var`; preferir `const`, `let` apenas quando há reatribuição
- Nenhuma variável, parâmetro ou import sem uso
- Funções com no máximo 2 parâmetros; se precisar de mais, usar objeto de opções
- Funções devem ser pequenas e com responsabilidade única; preferir funções puras
- Nunca usar `console.log`
- Nunca usar ternários

## JSX / UI

- Nunca usar strings literais diretamente no JSX — texto visível vem de constantes ou helpers
- Sempre usar `key` em listas
- Nunca criar objetos, arrays ou funções inline em props
- Componentes devem ser puros
- Evitar renderização condicional com ternários

## Imports

Ordem obrigatória (separar grupos com linha em branco, ordenar alfabeticamente dentro de cada grupo):

1. Builtin
2. External
3. Internal
4. Parent
5. Sibling
6. Index

## Acessibilidade

- Toda imagem deve ter `alt`
- Links semanticamente válidos
- Componentes interativos acessíveis via teclado

## Promises e Async

- Toda Promise com tratamento de erro
- Evitar promises aninhadas
- Preferir `async/await`

## Segurança

- Nunca usar `eval`
- Evitar acesso dinâmico a objetos sem validação

## TanStack Query

- Fonte única de verdade para dados remotos
- Evitar estados locais redundantes com query
- Mutations devem invalidar apenas caches necessários
- Requests apenas via services

## Modais

- Controle exclusivo via `ModalContext`
- Proibido abrir/fechar modais via `useState` local
- Todo modal deve ter `open`, `close` e `payload`
- Nunca usar ternários para modais

## Estilo visual

- TailwindCSS é a única fonte de estilo
- Sem CSS solto fora do Tailwind
- Tokens de design em `src/styles/` como CSS custom properties

## Configurações técnicas

**Path aliases**: `#/*` e `@/*` resolvem para `src/*`.

**Linting**: ESLint — código deve passar em `npm run lint` sem ajustes manuais.
