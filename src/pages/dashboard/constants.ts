import { CalendarDays, ClipboardCheck, type LucideIcon } from "lucide-react"

/**
 * Cards de estatística da Home.
 *
 * **Os valores são fixos** — "14 tarefas pendentes" e "3 próximas visitas" não
 * vêm de endpoint nenhum. `GET /users/me/tasks` existe e resolveria o primeiro;
 * visitas não têm entidade no backend. Ficam aqui, explícitos, em vez de
 * disfarçados no meio do JSX.
 *
 * A aparência saiu daqui: a constante carrega `tone` semântico, e a tradução
 * de tom para classe é do `tv` no componente. Antes cada item trazia três
 * strings de classe Tailwind, o que fazia a constante de dados decidir estilo.
 */

export type StatTone = "ok" | "warn"

export interface StatCard {
  icon: LucideIcon
  labelKey: string
  detailKey: string
  value: number
  tone: StatTone
}

export const STATIC_STATS: StatCard[] = [
  {
    icon: ClipboardCheck,
    labelKey: "dashboard.stats.pendingTasks",
    detailKey: "dashboard.stats.pendingTasksDetail",
    value: 14,
    tone: "ok",
  },
  {
    icon: CalendarDays,
    labelKey: "dashboard.stats.nextVisits",
    detailKey: "dashboard.stats.nextVisitsDetail",
    value: 3,
    tone: "warn",
  },
]
