# Plano — Schedule dos integrantes

Integração da feature `schedule` do `prissma-server` no `prissma-front`.

**Fontes conferidas:**

- Protótipo `PRISSMA App.dc.html` (seção `<!-- SCHEDULE -->`, bloco `AG`/`semana`) e
  `docs/PRISSMA_Telas_Completo_v2.md` · `docs/PRISSMA_Fluxos_Navegacao_v2.md` ·
  `docs/PRISSMA_Mapeamento_Frontend_v2.md`, lidos via MCP `claude_design`.
- Backend: `prissma-server/src/main/java/br/pucpr/prissma_server/schedule` (commits
  `9a0c25e`, `4c0456d`), migração `V18__create_team_schedule.sql`, `ScheduleServiceTest`.

---

## 1. O que a tela é

**Tela 15 da spec — "Schedule (da obra)", nível 2, papéis E + M, desktop.**

Uma grade `integrante × dia` por obra. Linha = membro ativo da obra; coluna = dia do
período (semana de segunda a domingo, ou mês inteiro). A célula mostra as **horas
alocadas** daquele integrante naquele dia; dia livre é célula vazia.

Sob o nome do integrante aparece a **responsabilidade** dele na obra ("Fundação",
"Estrutura", "Instalações") — texto livre que só existe para esta tela.

O que o backend faz questão de separar:

- **Alocação de horas** é dado desta feature (`schedule_allocations`), editável aqui.
- **Tarefas do dia** não são guardadas aqui: saem de `tasks` (responsável + período
  planejado) no momento da consulta. São leitura pura nesta tela.

### Não confundir com "Minha agenda"

São **duas telas diferentes** na spec, e o protótipo as embaralha:

| | Tela 7 — Minha agenda | Tela 15 — Schedule (da obra) |
|---|---|---|
| Nível | 1 (workspace) | **2 (obra)** |
| Conteúdo | strip de dias + blocos por horário do próprio usuário | grade integrante × dia da obra |
| Tipos/legenda | OBRA · ENTREGA · VISITA · LIVRE | Alocado · Outra etapa · Livre |
| Papéis | E A M | **E M** |
| Backend | não existe | `/projects/{id}/schedule` ✔ |
| Status | adiada (`DEFERRED_WORKSPACE_NAV`) | **é esta feature** |

No protótipo `PRISSMA App.dc.html` a chave `schedule` aparece no `WORKSPACE` nav com o
rótulo "Minha agenda", mas renderiza a grade da obra e tem o título
`['Schedule dos integrantes', 'Semana de 10 a 16 ago 2026']`. A spec v2 desfaz o nó:
Telas §15 classifica a grade como **nível 2**, e §7 descreve "Minha agenda" como outra
coisa (blocos por horário). O `agenda` que já existe em `DEFERRED_WORKSPACE_NAV` é a
tela 7 — **continua adiado, não é substituído por esta feature**.

---

## 2. Decisões

| # | Decisão | Motivo |
|---|---|---|
| D1 | A tela é **módulo de obra** (nível 2), em `/obras/:obraId/schedule` | Telas v2 §15 a classifica como nível 2, e o endpoint é `/projects/{projectId}/schedule`. Como módulo, herda `ObraLayout`, o `projectId` do Outlet, o guard e o cartão de contexto. |
| D2 | O módulo chama-se `schedule`; o `agenda` de nível 1 fica como está | São telas distintas (§1). Além disso `access.test.ts` proíbe o mesmo nome nos dois níveis. |
| D3 | A grade semanal renderiza os **7 dias** da resposta, com sábado e domingo atenuados | O próprio protótipo intitula a tela "Semana de **10 a 16** ago 2026" — o período é seg→dom; ele só desenhou as 5 colunas úteis. `totalAllocatedHours` é somado sobre os 7 dias no servidor: filtrar o fim de semana faria o total da linha não bater com as células e esconderia alocação de sábado. |
| D4 | A navegação de período usa `previousDate`/`nextDate` da resposta | O backend já devolve a data de referência do período anterior e do próximo justamente para o front não recalcular semana/mês. Nenhuma aritmética de data no cliente. |
| D5 | `view` e `date` vivem na **URL** (`useSearchParams`) | CLAUDE.md §8: estado que descreve o que a tela mostra vai na query string. |
| D6 | O terceiro estado da legenda é **"Sobreposição"**, derivado de `overlapped` | Ver §6. O "Outra etapa" do protótipo é decoração sem dado por trás. |
| D7 | Liberar um dia é `DELETE`, não `PUT` com 0 | `hours` tem `CHECK (hours > 0)` no banco e o service rejeita `<= 0`. Dia livre é ausência de linha. |
| D8 | No celular a grade **rola na horizontal**, em vez de o módulo sumir | Telas v2 marca a tela 15 como "desktop" e aponta Minha agenda como equivalente mobile — mas Minha agenda não existe. Esconder o módulo abaixo de `lg` deixaria o item do `ObraModuleRail` abrindo o nada. |

---

## 3. Contrato do backend

Base: `/api/projects/{projectId}/schedule` (o Vite faz proxy de `/api` para `:8080`).
Auth e `X-Workspace-Id` saem de `@/lib/api` — nenhum `fetch` cru nesta feature.

### 3.1 `GET /projects/{projectId}/schedule`

Permissão: `VIEW_PROJECT`.

| Query param | Obrigatório | Default | Erro |
|---|---|---|---|
| `view` | não | `WEEK` | `400 View must be WEEK or MONTH` |
| `date` | não | hoje (no servidor) | `400 Date must be in the format yyyy-MM-dd` |

`date` é uma data **de referência**, não o início do período: o servidor a normaliza para
a segunda-feira da semana (`WEEK`) ou o dia 1 do mês (`MONTH`).

Resposta `200` — `TeamScheduleResponse`:

```jsonc
{
  "constructionProjectId": 7,
  "view": "WEEK",                    // "WEEK" | "MONTH"
  "startDate": "2026-08-10",         // segunda (WEEK) ou dia 1 (MONTH)
  "endDate":   "2026-08-16",         // domingo (WEEK) ou último dia (MONTH)
  "previousDate": "2026-08-03",      // referência do período anterior
  "nextDate":     "2026-08-17",      // referência do próximo período
  "days": ["2026-08-10", "…", "2026-08-16"],
  "members": [
    {
      "userId": 10,
      "userName": "João Souza",
      "roleInProject": "ENGINEER",       // ProjectRole
      "userResponsibility": "Estrutura",  // pode ser null
      "totalAllocatedHours": 24.00,
      "hasOverlap": false,
      "days": [
        {
          "date": "2026-08-10",
          "allocatedHours": 8.00,        // 0 quando não há alocação
          "allocated": true,             // allocatedHours > 0
          "overlapped": false,           // > 1 tarefa do integrante nesse dia
          "tasks": [
            {
              "id": 31,
              "title": "Concretagem da laje",
              "status": "IN_PROGRESS",
              "priority": "HIGH",
              "stageId": 4,              // pode ser null
              "stageName": "Estrutura",  // pode ser null
              "plannedStartDate": "2026-08-10",
              "plannedEndDate": "2026-08-12"
            }
          ]
        }
      ]
    }
  ]
}
```

Notas que mudam o código do front:

- `members` já vem **só com membros `ACTIVE`**, ordenado por `joinedAt, id`. Não refiltrar
  nem reordenar no cliente.
- `members[].days` tem **exatamente** o mesmo tamanho e a mesma ordem de `days`. A grade
  pode iterar por índice, mas a `key` do React sai de `date`, não do índice (CLAUDE.md §12).
- `allocatedHours` é `BigDecimal` no servidor: chega como número JSON (`8.00` → `8`).
- Uma tarefa sem `plannedStartDate` usa `plannedEndDate` como período de um dia, e
  vice-versa; tarefa sem nenhuma das duas não aparece.

### 3.2 `PUT /projects/{projectId}/schedule/members/{memberUserId}/allocations/{date}`

Upsert de horas. Permissão: `MANAGE_TEAMS`. `date` no path, `yyyy-MM-dd`.

```jsonc
// request
{ "allocatedHours": 8 }

// 200
{ "constructionProjectId": 7, "userId": 10, "userName": "João Souza",
  "date": "2026-08-10", "allocatedHours": 8.00 }
```

Validação (todas `400`, mensagem em `message`):

- `allocatedHours` ausente → `Allocated hours are required`
- `<= 0` ou `> 24` → `Allocated hours must be greater than 0 and at most 24`
- mais de 2 casas decimais → `Allocated hours must have at most 2 decimal places`
- usuário não é membro da obra → `404 User is not a member of this project`
- membro não `ACTIVE` → `400 User is not an active member of this project`

### 3.3 `DELETE /projects/{projectId}/schedule/members/{memberUserId}/allocations/{date}`

Libera o dia. Permissão: `MANAGE_TEAMS`. `204 No Content`.
Sem alocação no dia → `404 Allocation not found`.

### 3.4 `PUT /projects/{projectId}/schedule/members/{memberUserId}/responsibility`

Permissão: `MANAGE_TEAMS`.

```jsonc
// request  — string vazia/só espaços é normalizada para null
{ "userResponsibility": "Estrutura" }

// 200
{ "constructionProjectId": 7, "userId": 10, "userName": "João Souza",
  "userResponsibility": "Estrutura" }
```

Máximo 100 caracteres → `400 User responsibility must be at most 100 characters`.

### 3.5 Permissão no front

A tela é visível para quem tem `VIEW_PROJECT`; **editar** exige `MANAGE_TEAMS`.
No cliente isso é `useProjectPermissions(projectId)`:

```ts
const canMutate = isAdmin || can(ProjectPermission.MANAGE_TEAMS)
```

Mesmo padrão de `useTarefasKanban` (`useTarefasKanban.ts:51`). O gate real continua sendo
o backend; aqui só se decide se a célula é `<button>` ou `<div>`.

---

## 4. Arquivos

Tudo dentro de `src/pages/obra-selecionada/` — é uma tela de obra, não vai para `shared`.

### Criar

```
types/schedule.ts                              # contrato + ScheduleView as const
services/schedule.service.ts                   # 4 chamadas
schemas/schedule.schema.ts                     # zod do formulário de horas
utils/scheduleFormat.ts                        # parseIsoDate, formatHours, rótulos, isWeekend
hooks/useSchedule.ts                           # useQuery + 3 useMutation + estado de URL
components/ScheduleTab.tsx                     # container (≤150 linhas)
components/ScheduleToolbar.tsx                 # Semana/Mês + ‹ Agosto 2026 ›
components/ScheduleGrid.tsx                    # tabela
components/ScheduleMemberCell.tsx              # avatar + nome + responsabilidade
components/ScheduleDayCell.tsx                 # célula de horas
components/ScheduleLegend.tsx                  # legenda dos três estados
components/ScheduleLoadingState.tsx            # esqueleto
components/ScheduleEmptyState.tsx              # obra sem integrante ativo
components/ScheduleErrorState.tsx              # erro de sistema + retry
components/AllocationModal.tsx                 # rhf + zod
components/ResponsibilityModal.tsx             # rhf + zod

services/__tests__/schedule.service.test.ts
hooks/__tests__/useSchedule.test.tsx
utils/__tests__/scheduleFormat.test.ts
schemas/__tests__/schedule.schema.test.ts
components/__tests__/ScheduleTab.test.tsx
components/__tests__/ScheduleGrid.test.tsx
components/__tests__/scheduleModals.test.tsx
```

### Alterar

| Arquivo | Mudança |
|---|---|
| `src/shared/constants/access.ts` | `"schedule"` em `OBRA_MODULES` + a linha nos **quatro** perfis (§5) |
| `src/shared/constants/nav.ts` | item em `OBRA_NAV` — `CalendarRange` de `lucide-react`, `labelKey: "sidebar.nav.schedule"` |
| `src/pages/obra-selecionada/modules.tsx` | `export function ScheduleModule()` |
| `src/app/App.tsx` | rota `schedule` sob `obras/:obraId`, dentro de `<ModuleGuard module="schedule">` |
| `src/locales/pt.json` · `en.json` · `es.json` | `sidebar.nav.schedule` + bloco `obra.schedule.*` nos **três** |

`DEFERRED_WORKSPACE_NAV` **não muda**: o `agenda` de lá é a tela 7 (§1).

Nada mais em `shared/` — `access.ts` e `nav.ts` são a fonte única que alimenta sidebar,
trilho mobile e guard, e existe teste que as cruza (`shared/constants/__tests__/nav.test.ts`:
`OBRA_NAV` precisa cobrir todos os `OBRA_MODULES`).

Posição na `OBRA_NAV`: **logo depois de `equipes`**. É o vizinho natural (a grade é a
equipe distribuída no tempo) e mantém a ordem da spec, em que Schedule vem na sequência
de Equipes.

---

## 5. Matriz de acesso

`ModuleAccess = Record<AppModule, AccessLevel>` — o TS obriga os quatro perfis a declarar
o módulo novo, e `access.test.ts` verifica isso explicitamente.

Fonte: Telas v2, índice — **tela 15, papéis "E M"**. Atenção: a matriz de Fluxos v2 §3,
de onde `access.ts` foi copiada, **não tem linha para a tela 15** (só para "Minha agenda",
que é a tela 7). Então este módulo é entrada nova na matriz, e o índice de Telas é a
autoridade:

| Perfil | `schedule` | Origem |
|---|---|---|
| engenheiro | `w` | Telas §15 "E"; e `access.test.ts` exige `w` em tudo para engenheiro |
| arquiteto | `""` | Telas §15 não o lista — escala de execução não é o escopo dele |
| cliente | `""` | Telas §15 não o lista; coerente com `equipes: ""` |
| mestre | `w` | Telas §15 "M" — é quem distribui a equipe no dia a dia |

> `"w"`/`""` controlam só a navegação. Quem libera o `PUT` é `MANAGE_TEAMS` no backend,
> via `useProjectPermissions`. Os dois precisam concordar: perfil `w` sem `MANAGE_TEAMS`
> renderiza botões que tomam 403.

---

## 6. Estados da célula e a legenda

O protótipo traz três chips: **Alocado**, **Outra etapa**, **Livre**. Vale registrar o que
"Outra etapa" é de fato no código do protótipo:

```js
const blockOn = etapa => `…background:${etapa === 'Instalações' ? V('b2') : V('b1')}…`
```

A cor é escolhida pela **responsabilidade do próprio integrante**, com `'Instalações'`
cravado no código — variação tonal decorativa, sem campo por trás. Não há, na resposta do
backend, nada que diga "este dia é de outra etapa": `userResponsibility` é texto livre e
`tasks[].stageName` também. Colorir por texto livre renderia uma paleta imprevisível.

O sinal real que o backend calcula é `overlapped` — mais de uma tarefa do mesmo integrante
no mesmo dia —, e ele existe também agregado em `hasOverlap`. É informação que o mestre de
obras precisa ver. Então o terceiro estado passa a ser **"Sobreposição"**, mantendo o tom
de ouro profundo do chip do meio:

```ts
export const DayState = {
  FREE:      "FREE",       // !allocated                  → célula vazia, borda pontilhada
  ALLOCATED: "ALLOCATED",  // allocated && !overlapped     → bg-gold-grad, horas em mono
  OVERLAP:   "OVERLAP",    // allocated && overlapped      → tom de alerta + horas
} as const
export type DayState = (typeof DayState)[keyof typeof DayState]
```

Object lookup + `as const`, nunca `switch` nem comparação com literal UPPERCASE
(CLAUDE.md §11).

CLAUDE.md §13 e Style Guide: status nunca depende só de cor. Toda célula alocada mostra o
texto `8h`, e a célula em sobreposição ganha `title`/`aria-label` listando as tarefas do
dia.

---

## 7. Camada por camada

### 7.1 `types/schedule.ts`

```ts
export const ScheduleView = { WEEK: "WEEK", MONTH: "MONTH" } as const
export type ScheduleView = (typeof ScheduleView)[keyof typeof ScheduleView]

export interface ScheduledTask {
  id: number
  title: string
  status: string
  priority: string
  stageId: number | null
  stageName: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
}

export interface DaySchedule {
  date: string
  allocatedHours: number
  allocated: boolean
  overlapped: boolean
  tasks: ScheduledTask[]
}

export interface MemberSchedule {
  userId: number
  userName: string
  roleInProject: RoleInProject
  userResponsibility: string | null
  totalAllocatedHours: number
  hasOverlap: boolean
  days: DaySchedule[]
}

export interface TeamSchedule {
  constructionProjectId: number
  view: ScheduleView
  startDate: string
  endDate: string
  previousDate: string
  nextDate: string
  days: string[]
  members: MemberSchedule[]
}
```

`status` e `priority` da tarefa ficam `string`: só entram em `title`/tooltip nesta tela, e
tipá-los aqui duplicaria os enums que já moram em `types/tarefas.ts`.

### 7.2 `services/schedule.service.ts`

Só o transporte, sem regra. `max-params: 3` → a alocação recebe um objeto.

```ts
export async function getSchedule(
  projectId: number,
  params: { view: ScheduleView; date?: string },
): Promise<TeamSchedule>
// GET /projects/{id}/schedule?view=WEEK&date=2026-08-12  (omitir `date` quando vazio)

export async function upsertAllocation(
  input: { projectId: number; userId: number; date: string; allocatedHours: number },
): Promise<ScheduleAllocation>

export async function deleteAllocation(
  input: { projectId: number; userId: number; date: string },
): Promise<void>

export async function updateResponsibility(
  input: { projectId: number; userId: number; userResponsibility: string | null },
): Promise<ScheduleMemberInfo>
```

Monte a query com `URLSearchParams` — concatenar string aqui é como um `date` vazio vira
`?date=` e o backend passa a receber string em branco.

### 7.3 `utils/scheduleFormat.ts`

**A armadilha principal da feature.** `new Date("2026-08-10")` é interpretado como
meia-noite **UTC**: em UTC-3 ele rende 09/08. Como toda coluna desta tela é uma data
sem hora, `formatDate` de `@/shared/utils/formatters` **não serve aqui** (ele tem
exatamente esse bug; corrigi-lo é dívida fora deste escopo).

```ts
/** "2026-08-10" → Date local. Sem isto a grade inteira anda um dia para trás. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isWeekend(iso: string): boolean                        // 0 e 6
export function formatWeekdayShort(iso: string, lang: string): string  // "Seg 10"
export function formatDayOfMonth(iso: string): string                  // "10" (view MONTH)
export function formatFullDate(iso: string, lang: string): string      // "10/08/2026" (aria-label)
export function formatMonthLabel(iso: string, lang: string): string    // "Agosto 2026"
export function weekRangeLabel(startIso, endIso, lang): WeekRangeLabel
export function formatHours(hours: number, lang: string): string       // 8 → "8h"; 7.5 → "7,5h"
export function dayStateOf(day: DaySchedule): DayState
export function initialsOf(name: string): string                       // "João Souza" → "JS"
```

`formatHours` corta zero à direita: `8.00` vindo do `BigDecimal` tem de sair `8h`, como no
protótipo — nunca `8.00h`. O `"h"` fica fora do `t()` — é símbolo de unidade, igual nas três
locales, mesmo critério de `formatCurrency`.

`weekRangeLabel` devolve `{ key, values }` em vez de texto pronto: a forma curta do
protótipo ("Semana de 10 a 16 ago 2026") só vale quando a semana cabe num mês; de 31/08 a
06/09 ela diria o mês errado em metade das colunas, e aí cada ponta leva o seu
(`obra.schedule.period.weekSpan`). A decisão fica no util; a view só passa a chave para
`t()`.

### 7.4 `hooks/useSchedule.ts`

Única camada de dados. Nada de `useState` para loading/erro, nada de `useEffect`.

```ts
export const scheduleKey = (projectId: number, view: ScheduleView, date: string | null) =>
  ["schedule", projectId, view, date] as const

export function useSchedule(projectId: number) {
  const [params, setParams] = useSearchParams()

  const view = params.get("view") === ScheduleView.MONTH ? ScheduleView.MONTH : ScheduleView.WEEK
  const date = params.get("date")          // null = hoje, resolvido pelo servidor

  const query = useQuery({
    queryKey: scheduleKey(projectId, view, date),
    queryFn: () => getSchedule(projectId, { view, date: date ?? undefined }),
    enabled: projectId > 0,
  })
  …
}
```

- `setView` troca `view` e **descarta** `date`: mudar de semana para mês com a data da
  semana anterior presa na URL leva para um mês que o usuário não pediu.
- `goPrevious`/`goNext` gravam `date` com `query.data.previousDate` / `nextDate` (D4).
- As três mutations invalidam `["schedule", projectId]` (prefixo) no `onSuccess` e emitem
  `toast.error(error.message)` no `onError` — a mensagem já vem traduzida do backend via
  `@/lib/api`. Tipo do erro é `Error`, **nunca** `any` (CLAUDE.md §9).
- `saveAllocation({ userId, date, hours })` decide entre `upsert` e `delete`: `hours === 0`
  (ou campo vazio) → `deleteAllocation` (D7).
- Retorno: `{ schedule, isLoading, isError, view, setView, goPrevious, goNext, canMutate,
  saveAllocation, saveResponsibility, isSaving }`.

### 7.5 Componentes

`ScheduleTab({ projectId })` — container. Chama `useSchedule` e `usePrimaryAction(null)`
antes de qualquer early return (são hooks). Trata `isLoading` **uma vez**, no topo, com
`<ScheduleLoadingState />`; `isError` com mensagem + botão de recarregar; `members` vazio
com empty state traduzido (CLAUDE.md §6 — nada de cadeia de `&&`).

`ScheduleToolbar` — segmentado Semana/Mês à esquerda, `‹ Agosto 2026 ›` à direita, com
`ChevronLeft`/`ChevronRight` e o rótulo em `<Num>`.

`ScheduleGrid` — `<table>` de verdade (cabeçalho é `<th scope="col">`, o integrante é
`<th scope="row">`): é tabela de dados, e leitor de tela precisa da associação
linha × coluna.
Primeira coluna `sticky left-0` com fundo próprio; wrapper `overflow-x-auto`. É isso que
faz a `view=MONTH` (28–31 colunas) e o celular funcionarem sem um segundo layout (D8).
Coluna de fim de semana recebe a variante atenuada (D3).

`ScheduleDayCell` — `<button>` quando `canMutate`, `<div>` quando não (CLAUDE.md §13: nada
de `onClick` em elemento não interativo). Horas em `<Num>`. `aria-label` descreve
integrante, dia e estado.

`ScheduleMemberCell` — avatar de iniciais sobre `bg-gold-grad`, nome em `font-semibold`,
responsabilidade em `text-on-surface-faint`. Quando `canMutate`, o bloco inteiro é o
`<button>` que abre `ResponsibilityModal`.

`AllocationModal` / `ResponsibilityModal` — `<Modal>` de `shared/components/ui/modal`,
`useForm({ resolver: zodResolver(...) })`, erro no campo (não em toast). A view não tem
lógica: o hook entrega tudo pronto (CLAUDE.md §5).

### 7.6 `schemas/schedule.schema.ts`

Espelha a validação do servidor — errar aqui vira 400 que o usuário não entende:

```ts
export const allocationSchema = z.object({
  // `z.number()` e não `z.coerce.number()`: o campo é registrado com
  // `valueAsNumber`, então input vazio chega NaN e cai em "obrigatório". O
  // coerce leria "" como 0 e apagaria a alocação sem ninguém ter pedido.
  allocatedHours: z
    .number({ message: "obra.schedule.errors.hoursRequired" })
    .min(0, "obra.schedule.errors.hoursRange")      // 0 = liberar o dia
    .max(24, "obra.schedule.errors.hoursRange")
    .refine(hasAtMostTwoDecimals, "obra.schedule.errors.hoursDecimals"),
})

export const responsibilitySchema = z.object({
  userResponsibility: z.string().trim().max(100, "obra.schedule.errors.responsibilityLength"),
})
```

`hasAtMostTwoDecimals` compara com tolerância (`|h*100 − round(h*100)| < 1e-9`): um
`(h * 100) % 1 === 0` cru reprovaria `0.07`, que em ponto flutuante vira `7.000000000000001`.

Detalhes que a implementação obrigou:

- **`noValidate` nos dois `<form>`.** Sem ele o `max`/`step` do input barram o submit antes
  do zod — no navegador aparece um balão nativo em inglês, fora do design, e no jsdom o
  evento de submit simplesmente não dispara (o teste do erro de campo nunca passaria).
- **O limite de 100 caracteres não é `maxLength` no input.** Cortar o texto em silêncio
  esconde a regra; quem barra é o zod, com a mensagem no campo.
- **O campo de horas é `type="text"` + `inputMode="numeric"` + `maxLength={2}`.** O
  `type="number"` trazia o spinner encostado no sufixo "h" e, pior, **ignora `maxLength`**
  — dava para digitar 999 e só descobrir o erro no submit. Dois dígitos é o teto real, já
  que o máximo é 24.
  > Consequência assumida: a alocação passa a ser em **horas inteiras**. "7,5h" não cabe
  > mais em dois caracteres. O banco e o `refine` de duas casas continuam aceitando
  > fração — se meia hora voltar a ser requisito, o ajuste é `maxLength={5}` e o texto de
  > ajuda de volta ao "com até duas casas".
- **O campo nasce vazio**, mesmo num dia já alocado; o valor atual vira `placeholder`.
  Campo pré-preenchido convida a salvar sem ler, e aqui salvar sem ler sobrescreve a
  alocação de outra pessoa. Vazio no submit cai em "Informe as horas do dia" — não apaga
  nada, porque apagar é o botão "Liberar o dia".

---

## 8. Design system

Nenhum token novo. Nenhum hex, nenhum `rgba` — `bun run lint:colors` reprova o build.
As medidas abaixo saíram do protótipo (`<!-- SCHEDULE -->`), convertidas para token/escala
Tailwind:

| Elemento | Protótipo | Aqui |
|---|---|---|
| Card da seção | `sf`, `1px bs`, raio 16px, padding 22px | `bg-surface-container-low border border-outline-variant rounded-2xl p-[22px]` |
| Moldura da grade | `1px bs`, raio 12px, `overflow:hidden` | `rounded-xl border border-outline-variant overflow-hidden` |
| Colunas | `grid-template-columns:170px repeat(5,1fr)` | coluna do integrante `w-[170px]`, dias `1fr` |
| Cabeçalho "INTEGRANTE" | 11px, caps, `letter-spacing:.08em`, `t3` | `text-[11px] uppercase tracking-[0.08em] text-on-surface-faint` |
| Cabeçalho do dia | 11.5px, `t2`, centralizado, padding 12/14 | `text-[11.5px] text-on-surface-variant text-center px-3.5 py-3` |
| Separador de linha | `border-bottom 1px bs`, exceto a última | `divide-y divide-outline-variant` |
| Célula (padding) | `10px 6px` | `px-1.5 py-2.5` |
| Bloco alocado | altura 34px, raio 8px, `b1`, mono 10.5px 600, texto branco | `h-[34px] rounded-lg bg-gold-grad text-on-primary` + `<Num className="text-[10.5px] font-semibold">` |
| Bloco "outra etapa" (`b2`) | mesmo bloco em ouro profundo | vira **sobreposição**: `bg-warn-bg text-warn` (§6) |
| Bloco livre | `rz` + `1px dashed bt` | `border border-dashed border-outline-variant bg-transparent` |
| Fim de semana (novo, D3) | — | mesma célula + `opacity-60`; cabeçalho em `text-on-surface-faint` |
| Segmentado Semana/Mês | pill `rz` + `1px bs` raio 999px, padding 4px; item 7/15px raio 999px; ativo `lt`/`ltT` | wrapper `rounded-full border border-outline-variant bg-surface-container-high p-1`; item ativo `bg-contrast text-on-contrast` |
| Navegação de período | 13px, setas `t3`, rótulo 600 | `text-[13px]`, setas `text-on-surface-faint`, `<Num className="font-semibold">` |
| Legenda | mt 16px, gap 18px, 11.5px `t2`; swatch 10×10 raio 3px | `mt-4 gap-[18px] text-[11.5px] text-on-surface-variant`; swatch `size-2.5 rounded-[3px]` |
| `8h`, `Agosto 2026`, datas | mono | `<Num>` — Style Guide v2 §3 |
| "Semana de 10 a 16 ago 2026" | subtítulo do H1 | **não** usar `<DimensionLine>`: `ObraLayout` já gastou a única por tela. Vai como linha de apoio da toolbar, em `font-mono text-[10.5px] text-on-surface-faint` |

Toda composição condicional em `tv()`. Zero template string em `className` (CLAUDE.md §16).
O modo claro sai de graça — os tokens já têm as duas versões em `styles/index.css`.

**Copy de canteiro** (Mapeamento v2 §5): "alocar", "liberar o dia", "frente de trabalho",
"efetivo". Nada de "item", "registro", "recurso".

---

## 9. Estados obrigatórios

Checklist da spec (Telas v2, "Checklist por tela") aplicado a esta tela:

- [ ] **Loading** — esqueleto da grade, não spinner
- [ ] **Vazio com CTA** — obra sem membros ativos → aponta para Equipes
- [ ] **Sucesso** — toast de canteiro ("8h alocadas para João em 10/08")
- [ ] **Erro por campo** — horas fora de 0–24 ou com 3 decimais, no próprio campo
- [ ] **Erro de sistema** — falha do `GET` com botão de retry (↺, não navega)
- [ ] **Sem permissão** — `ModuleGuard` → "Acesso negado"; `canMutate=false` → grade só leitura
- [ ] **Confirmação destrutiva** — liberar um dia já alocado pede confirmação
- [ ] **Modo claro** — conferir a grade nos dois temas
- [ ] **Linha de cota** — uma por tela; a desta já é a do `ObraLayout` (§8)

---

## 10. i18n

Chave nova entra nos **três** locales, sempre. Bloco `obra.schedule`:

```
title · subtitleWeek · subtitleMonth · views.week · views.month
columns.member · legend.allocated · legend.overlap · legend.free
empty.title · empty.description · empty.cta · error.title · error.retry
allocation.title · allocation.hours · allocation.help · allocation.clear · allocation.save
allocation.confirmClear
responsibility.title · responsibility.field · responsibility.placeholder
toast.allocationSaved · toast.allocationCleared · toast.responsibilitySaved
errors.hoursRange · errors.hoursDecimals · errors.responsibilityLength
a11y.cellAllocated · a11y.cellFree · a11y.cellOverlap · a11y.previousPeriod · a11y.nextPeriod
```

Mais `sidebar.nav.schedule` (pt "Schedule" · en "Schedule" · es "Agenda del equipo").

---

## 11. Testes

Vitest + Testing Library. O teste mora em `__tests__/` **dentro** da pasta do que ele
testa. A suíte tem ratchet de cobertura (`vitest.config.ts`: 95.5% statements / 89.8%
branches / 93.2% functions / 96.5% lines) — os números **nunca descem**, então a feature
precisa nascer coberta.

> Nota: o `CLAUDE.md` ainda afirma que "não há suíte de teste automatizada neste
> repositório". Está desatualizado — há 40+ arquivos de teste e o ratchet acima. Vale
> corrigir a frase em tarefa própria.

| Arquivo | O que prova |
|---|---|
| `services/__tests__/schedule.service.test.ts` | URL exata de cada verbo; `date` omitido não vira `?date=`; `DELETE` trata 204 sem corpo; erro do backend chega como `Error` com a `message` do servidor |
| `utils/__tests__/scheduleFormat.test.ts` | `parseIsoDate` não anda um dia para trás; `formatHours(8)` → `"8h"` e `formatHours(7.5)` → `"7,5h"`; `isWeekend` em sábado/domingo; rótulo de período nas duas views |
| `schemas/__tests__/schedule.schema.test.ts` | limites 0/24, 3 casas decimais reprovadas, responsabilidade de 101 caracteres reprovada |
| `hooks/__tests__/useSchedule.test.tsx` | `queryKey` muda com `view`/`date`; `enabled: false` com `projectId` 0; `goNext` usa `nextDate` da resposta (e não soma 7 dias); trocar de view limpa `date`; `hours === 0` chama `deleteAllocation`; `onSuccess` invalida; `onError` chama `toast.error` |
| `components/__tests__/ScheduleGrid.test.tsx` | uma linha por membro na ordem da resposta; 7 colunas na semana; coluna de fim de semana atenuada; célula alocada mostra `8h`; célula livre não mostra `0h`; `canMutate=false` → célula não é `button` |
| `components/__tests__/ScheduleTab.test.tsx` | esqueleto no loading; empty state sem membros; estado de erro com retry; clique na célula abre o modal; navegação de período dispara a query nova |
| `components/__tests__/scheduleModals.test.tsx` | erro de campo renderizado no campo (não em toast); "Liberar dia" pede confirmação e submete 0; submit desabilitado enquanto `isSaving` |

Mocks: mockar `../services/schedule.service` e `react-toastify` no próprio arquivo, como
em `hooks/__tests__/useStages.test.tsx`. Providers via `createHookWrapper` /
`renderWithProviders` de `@/test/renderWithProviders`. `renderWithProviders` aceita
`route` — use-o para exercitar `?view=MONTH`, já que `useSchedule` lê a URL.

Testes existentes que passam a cobrir o módulo novo sem edição:
`shared/constants/__tests__/nav.test.ts` (OBRA_NAV × OBRA_MODULES) e
`access.test.ts` (matriz completa nos quatro perfis). Se algum deles falhar depois da
mudança, o problema está em §4/§5, não no teste.

Backend: `ScheduleServiceTest` (449 linhas) já cobre o serviço, inclusive usando a mesma
semana do protótipo (10–16/08/2026). Nada a fazer no `prissma-server`.

---

## 12. Ordem de execução

1. `types/schedule.ts` → `services/schedule.service.ts` → teste do service.
2. `utils/scheduleFormat.ts` + `schemas/schedule.schema.ts` → testes (rápidos, e é onde
   mora a armadilha de fuso).
3. `hooks/useSchedule.ts` → teste do hook.
4. Componentes de baixo para cima: `ScheduleDayCell` → `ScheduleMemberCell` →
   `ScheduleGrid` → `ScheduleToolbar`/`ScheduleLegend` → modais → `ScheduleTab`.
5. Fiação: `access.ts`, `nav.ts`, `modules.tsx`, `App.tsx`, três locales.
6. Testes de componente.
7. `bun run lint && bun run build && bun run test` — e `bun --bun run dev` (porta 3000)
   para conferir a grade contra o protótipo, nos dois temas.

---

## 13. Checklist de saída

- [ ] `bun run lint` limpo
- [ ] `bun run build` passa (cor + tipos + bundle)
- [ ] `bun run test` passa e `bun run test:coverage` não derruba nenhum piso do ratchet
- [ ] Nenhum `useEffect` novo; nenhum `useState` para loading/erro
- [ ] Toda chamada de API em `useQuery`/`useMutation` via service; a view não importa `@/lib/api`
- [ ] Nenhuma data montada com `new Date(iso)` — só `parseIsoDate`
- [ ] Nenhum `switch`, nenhuma comparação contra literal UPPERCASE (object lookup + `as const`)
- [ ] Nenhuma cor fora dos tokens; nenhum texto fora de `t()`; as três locales atualizadas
- [ ] Um componente por arquivo; componente ≤ ~150 linhas; arquivo ≤ 300; `max-params` 3
- [ ] Célula é `<button>` só quando editável; `<table>` semântica com `th scope`
- [ ] Grade rola na horizontal em `MONTH` e no celular, com a coluna do integrante fixa
- [ ] Os nove estados de §9 conferidos

---

## 14. Estado da implementação

Implementado em 22/09/2026. Tudo de §4 existe, com os dois estados extras que §9 exigia
(`ScheduleEmptyState`, `ScheduleErrorState`).

Gates:

| Comando | Resultado |
|---|---|
| `bun run lint` | limpo (0 erros; 4 warnings pré-existentes em `StageFormModal`/`TaskFormModal`) |
| `bun run build` | passa — cor, `tsc -b` e bundle |
| `bun run test` | **1553 passam, 114 arquivos, zero falha** |
| `bun run test:coverage` | 95,51% stmts · 89,76% branches · 93,2% funcs · 96,67% lines |

86 testes novos em 7 arquivos. Cobertura só dos arquivos da feature: 96,96% statements ·
90% branches · 96,42% functions · 98,42% lines.

### Regressão pré-existente encontrada e corrigida

`DiarioDaObra.test.tsx` → *"mostra o erro da consulta com a mensagem do servidor"* falhava
antes desta feature (confirmado por `git stash` na árvore limpa).

Causa: o teste nasceu em `7016543` (09/09) quando `DiarioDaObra.tsx` renderizava
`{t("obra.diario.error")} (${error.message})`; a refatoração visual `f793b48` (16/09)
derrubou a mensagem do servidor e deixou só a frase genérica. Ninguém rodou a suíte. Não é
teste errado — é o componente que regrediu.

Corrigido restaurando a forma anterior em `DiarioDaObra.tsx:122`. Uma linha, fora do escopo
desta feature, feita porque a falha impedia o vitest de emitir **qualquer** relatório de
cobertura (sem suíte verde ele não escreve nem `coverage/`).

### O ratchet de cobertura não está pegando

Medido com a suíte verde:

| | Medido | Piso declarado | |
|---|---|---|---|
| Statements | 95,51% | 95,5% | ✔ |
| Branches | **89,76%** | 89,8% | ✘ abaixo |
| Functions | 93,2% | 93,2% | ✔ no limite |
| Lines | 96,67% | 96,5% | ✔ |

Branches está **abaixo do piso** e mesmo assim `vitest run --coverage` sai com código 0.
O motivo é a forma do config: `vitest.config.ts` declara

```ts
thresholds: { global: { statements: 95.5, branches: 89.8, ... } }
```

e o Vitest 5 lê as chaves de `thresholds` que não são opções conhecidas como **glob de
arquivos**. `global` não casa com arquivo nenhum, então o bloco inteiro é ignorado em
silêncio. Confirmado: com a forma achatada (`--coverage.thresholds.lines=99.9`) o run falha
com `ERROR: Coverage ... does not meet global threshold` e sai 1; com o config atual, nada.

Ou seja, a trava que o comentário do arquivo descreve ("o CI travar a REGRESSÃO") nunca
rodou. Corrigir é mover as quatro chaves para o nível de `thresholds` — mas isso **reprova
o build hoje**, porque branches está 0,04 ponto abaixo. Por isso fica como proposta
(CLAUDE.md §22), não como mudança: o time precisa decidir entre baixar o piso para o
medido ou subir a cobertura de branches antes de ligar a trava.
