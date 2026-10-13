import type { DiarioEntry } from "../types/diario"

export interface DiaryDay {
  /** `YYYY-MM-DD` no fuso local. */
  key: string
  date: Date
  entries: DiarioEntry[]
}

function localKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** Agora em `datetime-local` (hora local, sem segundos). */
export function nowForInput(): string {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/**
 * Registros agrupados por dia, do mais recente ao mais antigo — a linha do
 * tempo do redesign lê como um caderno de obra: um cabeçalho por dia.
 */
export function groupByDay(entries: DiarioEntry[]): DiaryDay[] {
  const sorted = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate))
  const days: DiaryDay[] = []
  for (const entry of sorted) {
    const date = new Date(entry.entryDate)
    const key = localKey(date)
    const last = days[days.length - 1]
    if (last?.key === key) last.entries.push(entry)
    else days.push({ key, date, entries: [entry] })
  }
  return days
}

export type RelativeDay = "today" | "yesterday" | null

/** "Hoje" e "Ontem" pelo calendário local; os demais dias levam a data. */
export function relativeDay(date: Date): RelativeDay {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (localKey(date) === localKey(today)) return "today"
  if (localKey(date) === localKey(yesterday)) return "yesterday"
  return null
}
