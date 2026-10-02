import { todayIsoDate } from "@/shared/utils/formatters"

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day + days)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
 * Janela da tarefa criada pela adição rápida: começa hoje — ou no início da
 * etapa, se ela ainda não começou, porque tarefa não pode nascer antes da
 * etapa — e vence `days` dias depois.
 */
export function quickAddDates(stageStart: string | null, days: number) {
  const today = todayIsoDate()
  const start = stageStart && stageStart.slice(0, 10) > today ? stageStart.slice(0, 10) : today
  return { plannedStartDate: start, plannedEndDate: addDays(start, days) }
}
