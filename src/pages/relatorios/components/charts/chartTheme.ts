/**
 * Cores e traços dos gráficos de analytics.
 *
 * Sempre `var(--token)`: o SVG não lê classe do Tailwind, e o `var()` segue o
 * tema ativo — inclusive o clone claro de onde sai o PDF.
 */
export const SERIES = {
  planned: "var(--ink-3)",
  executed: "var(--gold)",
  exceeded: "var(--danger)",
  done: "var(--success)",
  open: "var(--gold)",
  overdue: "var(--danger)",
} as const

/** Previsto é sempre tracejado: a série se distingue pelo traço, não só pela cor. */
export const PLANNED_DASH = "5 4"

export const AXIS_TICK = { fill: "var(--ink-3)", fontSize: 11 }
export const GRID_STROKE = "var(--border)"
export const CURSOR = { stroke: "var(--border-strong)" }
export const BAR_CURSOR = { fill: "var(--raised)", fillOpacity: 0.4 }
export const CHART_HEIGHT = 260
export const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: 0 }
