import type { Expense } from "@/shared/types/budget"
import { startOfLocalDay } from "@/shared/utils/status"

/** Caixa do SVG (viewBox) e margens internas. */
export const CURVE_BOX = { width: 640, height: 220, left: 8, right: 8, top: 16, bottom: 26 } as const

const PLANNED_STEPS = 40

export interface CurveMonth {
  x: number
  date: Date
}

export interface CurveGeometry {
  /** Gasto acumulado em degraus, até hoje. */
  actual: string
  /** Área sob o gasto, para o preenchimento em gradiente. */
  area: string
  /** Curva S planejada (smoothstep de 0 ao orçado). */
  planned: string
  months: CurveMonth[]
  /** x de hoje (ou do fim, se a obra já terminou) e y do gasto atual. */
  nowX: number
  spentY: number
  budgetY: number
  /** Leitura na posição x do ponteiro, para o tooltip. */
  valueAt: (x: number) => { date: Date; planned: number; spent: number; future: boolean }
}

function smoothstep(u: number): number {
  const t = Math.max(0, Math.min(1, u))
  return t * t * (3 - 2 * t)
}

function time(value: string): number {
  return (startOfLocalDay(value) ?? new Date(value)).getTime()
}

/**
 * Geometria da curva de gastos (redesign): o gasto real em degraus contra a
 * curva S planejada — o jeito que obra gasta: pouco no começo, muito no meio,
 * pouco no acabamento. `null` sem janela planejada válida.
 */
export function buildCurve(
  window: { start: string | null; end: string | null },
  planned: number,
  expenses: Expense[],
): CurveGeometry | null {
  if (!window.start || !window.end) return null
  const start = time(window.start)
  const end = time(window.end)
  if (!(end > start)) return null

  const { width: W, height: H, left, right, top, bottom } = CURVE_BOX
  const sorted = [...expenses].sort((a, b) => a.spentAt.localeCompare(b.spentAt))
  const spentTotal = sorted.reduce((sum, e) => sum + e.amount, 0)
  const maxY = Math.max(planned, spentTotal, 1) * 1.08
  const now = Math.min(Date.now(), end)
  const x = (t: number) => left + ((Math.max(start, Math.min(end, t)) - start) / (end - start)) * (W - left - right)
  const y = (v: number) => top + (1 - v / maxY) * (H - top - bottom)

  let acc = 0
  const points: [number, number][] = [[x(start), y(0)]]
  for (const expense of sorted) {
    const at = x(time(expense.spentAt))
    points.push([at, y(acc)])
    acc += expense.amount
    points.push([at, y(acc)])
  }
  points.push([x(now), y(acc)])
  const actual = points.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ")

  const plannedPath = Array.from({ length: PLANNED_STEPS + 1 }, (_, i) => {
    const u = i / PLANNED_STEPS
    return `${i ? "L" : "M"}${x(start + u * (end - start)).toFixed(1)} ${y(smoothstep(u) * planned).toFixed(1)}`
  }).join(" ")

  const months: CurveMonth[] = []
  const cursor = new Date(start)
  cursor.setDate(1)
  cursor.setMonth(cursor.getMonth() + 1)
  while (cursor.getTime() < end) {
    months.push({ x: x(cursor.getTime()), date: new Date(cursor) })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return {
    actual,
    area: `${actual} L${x(now).toFixed(1)} ${y(0).toFixed(1)} Z`,
    planned: plannedPath,
    months,
    nowX: x(now),
    spentY: y(acc),
    budgetY: y(planned),
    valueAt: (px) => {
      const t = start + ((px - left) / (W - left - right)) * (end - start)
      const spent = sorted.filter((e) => time(e.spentAt) <= t).reduce((sum, e) => sum + e.amount, 0)
      return { date: new Date(t), planned: smoothstep((t - start) / (end - start)) * planned, spent, future: t > Date.now() }
    },
  }
}
