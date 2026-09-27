import { startOfLocalDay } from "@/shared/utils/status"

const DAY = 86_400_000
/** Folga antes da primeira etapa e depois da última, para as barras não colarem na borda. */
const PADDING_DAYS = 4

export interface MonthMark {
  /** Posição na régua, 0–100. */
  x: number
  date: Date
}

export interface GanttScale {
  months: MonthMark[]
  today: number
  /** Posição de uma data na régua, 0–100. */
  pos: (date: Date) => number
}

interface Dated {
  plannedStartDate: string | null
  plannedEndDate: string | null
}

/**
 * Régua do cronograma: de alguns dias antes da primeira etapa até depois da
 * última (ou de hoje, o que vier depois), com uma marca em cada virada de mês.
 * Datas puras do backend viram meia-noite local antes da conta.
 */
export function ganttScale(stages: Dated[], now = new Date()): GanttScale | null {
  const starts = stages.map((s) => startOfLocalDay(s.plannedStartDate)).filter((d): d is Date => !!d)
  const ends = stages.map((s) => startOfLocalDay(s.plannedEndDate)).filter((d): d is Date => !!d)
  if (starts.length === 0 || ends.length === 0) return null

  const min = Math.min(...starts.map(Number)) - PADDING_DAYS * DAY
  const max = Math.max(...ends.map(Number), now.getTime() + 7 * DAY) + PADDING_DAYS * DAY
  const pos = (date: Date) => ((date.getTime() - min) / (max - min)) * 100

  const months: MonthMark[] = []
  const cursor = new Date(min)
  cursor.setDate(1)
  cursor.setHours(0, 0, 0, 0)
  cursor.setMonth(cursor.getMonth() + 1)
  while (cursor.getTime() < max) {
    months.push({ x: pos(cursor), date: new Date(cursor) })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return { months, today: pos(now), pos }
}
