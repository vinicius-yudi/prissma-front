export type BudgetTone = "ok" | "warning" | "exceeded"

/** Acima disto a categoria fica em alerta (DS v2: âmbar a partir de 85%). */
export const NEAR_LIMIT_PERCENT = 85

/** Abaixo deste avanço físico a projeção é ruído, não previsão. */
export const PROJECTION_MIN_PROGRESS = 12

/** Diferença até a qual a projeção conta como "dentro do orçado". */
const PROJECTION_TOLERANCE = 0.03

export function calculatePercent(spent: number, planned: number): number {
  if (planned <= 0) return spent > 0 ? 100 : 0
  return (spent / planned) * 100
}

export function resolveBudgetTone(percent: number, exceeded?: boolean): BudgetTone {
  if (exceeded || percent > 100) return "exceeded"
  if (percent > NEAR_LIMIT_PERCENT) return "warning"
  return "ok"
}

export type ProjectionTrend = "above" | "below" | "within"

export interface Projection {
  value: number
  /** Fração acima (+) ou abaixo (−) do orçado. */
  diff: number
  trend: ProjectionTrend
}

function trendOf(diff: number): ProjectionTrend {
  if (Math.abs(diff) <= PROJECTION_TOLERANCE) return "within"
  return diff > 0 ? "above" : "below"
}

/**
 * Projeção ao fim da obra: gasto ÷ avanço físico. Só com a obra em andamento
 * e acima de 12% de avanço — antes disso qualquer gasto inicial (sinal de
 * fornecedor, mobilização) projeta um estouro que não existe.
 */
export function projectEnd(spent: number, planned: number, progress: number | null): Projection | null {
  if (progress === null || progress < PROJECTION_MIN_PROGRESS || planned <= 0) return null
  const value = spent / (progress / 100)
  const diff = value / planned - 1
  return { value, diff, trend: trendOf(diff) }
}
