import { DayState, type DaySchedule } from "../types/schedule"

/**
 * Formatação das datas do Schedule.
 *
 * Existe separado de `@/shared/utils/formatters` por causa de uma armadilha:
 * toda data desta tela é `yyyy-MM-dd` **sem hora**, e `new Date("2026-08-10")`
 * é interpretado como meia-noite **UTC**. Em UTC-3 isso rende 09/08 — a grade
 * inteira andaria um dia para trás. `formatDate` do módulo compartilhado tem
 * exatamente esse comportamento e não serve aqui.
 */

/** "2026-08-10" → Date no fuso local, à meia-noite. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isWeekend(iso: string): boolean {
  const weekday = parseIsoDate(iso).getDay()
  return weekday === 0 || weekday === 6
}

/** O Intl devolve "seg." e "ago." em pt-BR; o ponto abreviativo não entra na grade. */
function trimDot(value: string): string {
  return value.replace(/\.$/, "")
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function part(iso: string, lang: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(lang, options).format(parseIsoDate(iso))
}

/** Cabeçalho de coluna na semana: "Seg 10". */
export function formatWeekdayShort(iso: string, lang: string): string {
  return `${capitalize(trimDot(part(iso, lang, { weekday: "short" })))} ${parseIsoDate(iso).getDate()}`
}

/** Cabeçalho de coluna no mês: só o dia, que é o que cabe em 31 colunas. */
export function formatDayOfMonth(iso: string): string {
  return String(parseIsoDate(iso).getDate())
}

/** Data por extenso curta, para `aria-label` e tooltip: "10/08/2026". */
export function formatFullDate(iso: string, lang: string): string {
  return part(iso, lang, { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Rótulo da navegação de período: "Agosto 2026". */
export function formatMonthLabel(iso: string, lang: string): string {
  const date = parseIsoDate(iso)
  return `${capitalize(trimDot(part(iso, lang, { month: "long" })))} ${date.getFullYear()}`
}

function formatDayMonth(iso: string, lang: string): string {
  return `${parseIsoDate(iso).getDate()} ${trimDot(part(iso, lang, { month: "short" }))}`
}

function formatDayMonthYear(iso: string, lang: string): string {
  return `${formatDayMonth(iso, lang)} ${parseIsoDate(iso).getFullYear()}`
}

export interface WeekRangeLabel {
  /** Sufixo da chave em `obra.schedule.period`. */
  key: "week" | "weekSpan"
  values: Record<string, string>
}

/**
 * Legenda da semana. A forma curta do protótipo — "Semana de 10 a 16 ago 2026"
 * — só funciona quando a semana inteira cai no mesmo mês; uma semana de 31/08 a
 * 06/09 renderizada assim diria o mês errado em metade dos dias. Nesse caso
 * cada ponta leva seu próprio mês.
 */
export function weekRangeLabel(startIso: string, endIso: string, lang: string): WeekRangeLabel {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return {
      key: "week",
      values: {
        start: String(start.getDate()),
        end: String(end.getDate()),
        month: trimDot(part(startIso, lang, { month: "short" })),
        year: String(start.getFullYear()),
      },
    }
  }

  const sameYear = start.getFullYear() === end.getFullYear()
  return {
    key: "weekSpan",
    values: {
      start: sameYear ? formatDayMonth(startIso, lang) : formatDayMonthYear(startIso, lang),
      end: formatDayMonthYear(endIso, lang),
    },
  }
}

/**
 * "8h", "7,5h". O `BigDecimal` do backend chega como `8` para `8.00`, e o
 * protótipo escreve `8h` — zero à direita nunca aparece.
 *
 * O "h" fica fora do `t()` de propósito: é símbolo de unidade, idêntico em
 * pt/en/es. Mesmo critério de `formatCurrency`, que também não traduz o símbolo.
 */
export function formatHours(hours: number, lang: string): string {
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(hours)}h`
}

export function dayStateOf(day: DaySchedule): DayState {
  if (!day.allocated) return DayState.FREE
  return day.overlapped ? DayState.OVERLAP : DayState.ALLOCATED
}

/** Iniciais do avatar: "João Souza" → "JS". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ""
  return `${first}${last}`.toUpperCase()
}
