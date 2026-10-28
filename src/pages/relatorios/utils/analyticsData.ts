import { todayIsoDate } from "@/shared/utils/formatters"
import { startOfLocalDay } from "@/shared/utils/status"

import type { AnalyticsDashboard, BudgetMonthPoint, MemberEffortLine } from "../types/analytics"

export interface BudgetCurvePoint {
  month: string
  planned: number
  /** `null` depois do mês corrente: o gasto real para no presente. */
  executed: number | null
}

/**
 * Curva acumulada de previsto × executado, refeita a partir dos valores do mês.
 *
 * Não dá para usar o `plannedCumulative` do backend em "Todas as obras": ele
 * soma, mês a mês, o acumulado de cada obra que TEM linha naquele mês — obra
 * cujo cronograma já acabou some da soma e a curva consolidada despenca. O
 * valor do mês é aditivo entre obras, então o acumulado corrido dele é exato
 * nos dois modos.
 */
export function buildBudgetCurve(points: BudgetMonthPoint[]): BudgetCurvePoint[] {
  const currentMonth = `${todayIsoDate().slice(0, 7)}-01`
  let planned = 0
  let executed = 0
  return points.map((point) => {
    planned += point.plannedAmount
    executed += point.executedAmount
    return { month: point.month, planned, executed: point.month > currentMonth ? null : executed }
  })
}

export interface MemberEffort {
  userId: number
  userName: string
  done: number
  /** Atribuídas, ainda abertas e dentro do prazo. */
  open: number
  overdue: number
}

/**
 * Esforço por membro somado entre obras. O backend entrega o grão obra ×
 * usuário; sem agregar, quem trabalha em duas obras viraria duas barras.
 */
export function buildMemberEffort(lines: MemberEffortLine[]): MemberEffort[] {
  const byUser = new Map<number, MemberEffort>()
  for (const line of lines) {
    const current = byUser.get(line.userId) ?? { userId: line.userId, userName: line.userName, done: 0, open: 0, overdue: 0 }
    current.done += line.doneTasks
    current.overdue += line.overdueTasks
    current.open += line.assignedTasks - line.doneTasks - line.overdueTasks
    byUser.set(line.userId, current)
  }
  return [...byUser.values()].sort((a, b) => total(b) - total(a) || a.userName.localeCompare(b.userName))
}

function total(member: MemberEffort): number {
  return member.done + member.open + member.overdue
}

/** Nenhum dado operacional no recorte: obra recém-criada ou DW ainda sem carga. */
export function isDashboardEmpty(data: AnalyticsDashboard): boolean {
  const { summary } = data
  return (
    summary.totalStages === 0 &&
    summary.totalTasks === 0 &&
    summary.budgetPlanned === 0 &&
    summary.budgetExecuted === 0 &&
    data.memberEffort.length === 0
  )
}

/** "out/26" — rótulo de eixo de mês. */
export function formatMonth(iso: string, locale: string): string {
  const date = startOfLocalDay(iso)
  if (!date) return iso
  return date.toLocaleDateString(locale, { month: "short", year: "2-digit" }).replace(".", "")
}

/** "27/10" — rótulo de eixo de semana. */
export function formatDayMonth(iso: string, locale: string): string {
  const date = startOfLocalDay(iso)
  if (!date) return iso
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })
}

/** Data pura do backend (`yyyy-MM-dd`) no fuso do usuário — sem o recuo de um dia do parse UTC. */
export function formatLocalDate(iso: string, locale: string): string {
  return startOfLocalDay(iso)?.toLocaleDateString(locale) ?? iso
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`
}
