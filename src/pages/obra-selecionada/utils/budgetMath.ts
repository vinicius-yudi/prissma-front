export type BudgetTone = "ok" | "warning" | "exceeded"

export function calculatePercent(spent: number, planned: number): number {
  if (planned <= 0) return spent > 0 ? 100 : 0
  return (spent / planned) * 100
}

export function resolveBudgetTone(percent: number, exceeded?: boolean): BudgetTone {
  if (exceeded || percent > 100) return "exceeded"
  if (percent >= 80) return "warning"
  return "ok"
}
