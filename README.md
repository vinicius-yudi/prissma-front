# PRISSMA — Frontend

Plataforma web de gerenciamento de obras e reformas de pequeno porte. Centraliza etapas, equipes, tarefas e orçamento em um único sistema, permitindo que engenheiros, arquitetos, mestres de obra e proprietários acompanhem o andamento de cada projeto em tempo real.

## Sobre o projeto

O PRISSMA é um SaaS voltado ao ramo residencial e comercial de pequeno porte. Seus três pilares são:

1. **Gerenciamento de etapas e equipes** — acompanhamento do ciclo completo da obra
2. **Controle orçamentário** — relatórios e dashboards financeiros
3. **Fluxo de trabalho integrado** — visibilidade compartilhada entre todos os envolvidos

## Stack

| Camada | Tecnologia |
|---|---|
| Bundler | [Vite](https://vite.dev) |
| UI | [React 19](https://react.dev) |
| Tipagem | [TypeScript 5](https://www.typescriptlang.org) |
| Estilo | [TailwindCSS 4](https://tailwindcss.com) |
| Roteamento | [React Router DOM 7](https://reactrouter.com) |
| Dados remotos | [TanStack Query 5](https://tanstack.com/query) |
| Ícones | [Lucide React](https://lucide.dev) |
| Animações | [@lottiefiles/dotlottie-react](https://github.com/LottieFiles/dotlottie-react) |
| Notificações | [React Toastify](https://fkhadra.github.io/react-toastify) |
| Lint | ESLint 9 + typescript-eslint |

## Pré-requisitos

- [Bun](https://bun.sh) >= 1.x

## Instalação

```bash
bun install
```

## Comandos

```bash
bun --bun run dev      # Servidor de desenvolvimento na porta 3000
bun --bun run build    # Build de produção (tsc + vite build)
bun --bun run lint     # Verificação estática de código
bun --bun run preview  # Prévia local do build de produção
```

## Estrutura de pastas

```
src/
├── pages/          # Features da aplicação (feature-based)
│   ├── login/
│   ├── cadastro/
│   └── dashboard/
├── shared/         # Código reutilizável entre páginas
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── constants/
├── assets/
├── styles/         # Tokens de design como CSS custom properties
└── main.tsx
```

Cada página é uma pasta autocontida com seus próprios `components/`, `hooks/`, `services/`, `utils/` e `types.ts`. Código específico de uma feature nunca vai para `shared/`.

## Path aliases

`#/*` e `@/*` resolvem para `src/*`.

```ts
import { Button } from '#/shared/components/Button'
```
