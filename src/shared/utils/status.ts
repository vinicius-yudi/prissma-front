/**
 * Status de exibição — obra, etapa e tarefa falam o mesmo idioma na UI.
 *
 * O banco tem três vocabulários distintos (obra: PLANNING/IN_PROGRESS/PAUSED/
 * COMPLETED/CANCELLED · etapa: PLANNED/IN_PROGRESS/BLOCKED/DONE · tarefa:
 * TODO/IN_PROGRESS/BLOCKED/DONE), mas o design tem **um** badge com cinco
 * estados. Este módulo é a tradução única entre os dois.
 *
 * Ponto importante: **"Em atraso" não é um status do banco.** É derivado da
 * data de término planejada contra hoje. Qualquer tela que trate atraso como
 * valor persistido vai divergir das outras.
 */

/** Os cinco estados do badge (Style Guide v2 §5). */
export type BadgeState = "done" | "progress" | "late" | "paused" | "idle"

const STATE_BY_STATUS: Record<string, BadgeState> = {
  // concluído
  COMPLETED: "done",
  DONE: "done",
  // em andamento
  IN_PROGRESS: "progress",
  // pausado / impedido
  PAUSED: "paused",
  BLOCKED: "paused",
  // não iniciado
  PLANNING: "idle",
  PLANNED: "idle",
  TODO: "idle",
  CANCELLED: "idle",
}

/** Estados que já terminaram e por isso nunca contam como atraso. */
const TERMINAL = new Set(["COMPLETED", "DONE", "CANCELLED"])

export interface DisplayStatus {
  state: BadgeState
  /** Chave i18n do rótulo, ex.: "status.IN_PROGRESS" ou "status.LATE". */
  labelKey: string
  /** Dias corridos além do prazo. 0 quando não há atraso. */
  daysLate: number
}

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Meia-noite local do dia que a string descreve.
 *
 * O backend manda data pura — `plannedEndDate` chega como `"2026-06-18"` — e o
 * JS lê esse formato como meia-noite **UTC**. Em qualquer fuso a oeste de
 * Greenwich o instante cai no dia anterior, e a obra que vence hoje já nasce
 * vencida. Ler ano/mês/dia e remontar a data no fuso do usuário tira o
 * deslocamento. String com hora (`"2026-06-18T00:00:00"`) já é local e
 * atravessa este caminho sem mudar de dia.
 */
export function startOfLocalDay(value: string | null | undefined): Date | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Dias corridos entre a data planejada e hoje. Negativo ou 0 = no prazo. */
export function daysLate(plannedEndDate: string | null | undefined): number {
  const due = startOfLocalDay(plannedEndDate)
  if (!due) return 0
  const diff = startOfToday().getTime() - due.getTime()
  if (diff <= 0) return 0
  // Arredonda, não trunca: onde há horário de verão o dia tem 23h ou 25h, e o
  // truque do piso engoliria um dia inteiro de atraso.
  return Math.round(diff / 86_400_000)
}

/**
 * Andamento estimado pela janela planejada.
 *
 * É uma aproximação por tempo decorrido, não medição de obra — o backend ainda
 * não expõe percentual executado. Fica aqui, e não em cada card, para que
 * sidebar e lista de obras nunca mostrem números diferentes para a mesma obra.
 */
export function dateProgress(
  start: string | null | undefined,
  end: string | null | undefined,
): number {
  if (!start || !end) return 0
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0
  const raw = ((Date.now() - startMs) / (endMs - startMs)) * 100
  return Math.max(0, Math.min(100, Math.round(raw)))
}

interface DeriveInput {
  status: string
  plannedEndDate?: string | null
}

export function deriveStatus({ status, plannedEndDate }: DeriveInput): DisplayStatus {
  const late = TERMINAL.has(status) ? 0 : daysLate(plannedEndDate)

  if (late > 0) {
    return { state: "late", labelKey: "status.LATE", daysLate: late }
  }

  return {
    state: STATE_BY_STATUS[status] ?? "idle",
    labelKey: `status.${status}`,
    daysLate: 0,
  }
}
