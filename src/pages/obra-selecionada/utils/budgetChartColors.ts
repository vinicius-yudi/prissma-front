import type { BudgetTone } from "./budgetMath"

export const DONUT_COLORS = [
  "#7C5CFF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#8B5CF6",
  "#84CC16",
  "#F97316",
  "#3B82F6",
] as const

export function donutColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length]
}

export const TONE_COLOR: Record<BudgetTone, string> = {
  ok: "#7C5CFF",
  warning: "#F59E0B",
  exceeded: "#EF4444",
}
