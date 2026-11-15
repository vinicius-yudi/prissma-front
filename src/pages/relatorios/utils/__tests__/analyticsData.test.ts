import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AnalyticsDashboard, BudgetMonthPoint, MemberEffortLine } from "../../types/analytics"
import { buildBudgetCurve, buildMemberEffort, formatLocalDate, formatPercent, isDashboardEmpty } from "../analyticsData"

const HOJE = new Date(2026, 9, 27, 10, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(HOJE)
})

afterEach(() => {
  vi.useRealTimers()
})

function month(iso: string, plannedAmount: number, executedAmount: number, cumulative = { planned: 0, executed: 0 }): BudgetMonthPoint {
  return { month: iso, plannedAmount, executedAmount, plannedCumulative: cumulative.planned, executedCumulative: cumulative.executed }
}

describe("buildBudgetCurve", () => {
  it("acumula a partir do valor do mês, e não do acumulado do backend", () => {
    // Consolidado de duas obras: a A acabou em agosto, a B segue. O backend
    // soma só o acumulado de quem tem linha no mês — em setembro a soma dele
    // "esquece" os 100 da obra A. O acumulado corrido não esquece.
    const points = [
      month("2026-07-01", 100, 50, { planned: 100, executed: 50 }),
      month("2026-08-01", 0, 30, { planned: 100, executed: 80 }),
      month("2026-09-01", 40, 10, { planned: 40, executed: 10 }),
    ]

    expect(buildBudgetCurve(points).map((point) => point.planned)).toEqual([100, 100, 140])
    expect(buildBudgetCurve(points).map((point) => point.executed)).toEqual([50, 80, 90])
  })

  it("para a linha do executado no mês corrente", () => {
    const curve = buildBudgetCurve([month("2026-10-01", 10, 5), month("2026-11-01", 10, 0), month("2026-12-01", 10, 0)])

    expect(curve.map((point) => point.executed)).toEqual([5, null, null])
    expect(curve.map((point) => point.planned)).toEqual([10, 20, 30])
  })
})

function effort(userId: number, userName: string, assigned: number, done: number, overdue: number, projectId = 1): MemberEffortLine {
  return { projectId, userId, userName, roleInProject: "ENGINEER", assignedTasks: assigned, doneTasks: done, overdueTasks: overdue }
}

describe("buildMemberEffort", () => {
  it("soma o mesmo membro entre obras e separa abertas no prazo", () => {
    const members = buildMemberEffort([effort(2, "Bruno", 5, 3, 1, 1), effort(2, "Bruno", 4, 1, 2, 2), effort(3, "Ana", 1, 1, 0)])

    expect(members).toEqual([
      { userId: 2, userName: "Bruno", done: 4, open: 2, overdue: 3 },
      { userId: 3, userName: "Ana", done: 1, open: 0, overdue: 0 },
    ])
  })

  it("mantém o membro sem tarefa, zerado — é informação de alocação", () => {
    expect(buildMemberEffort([effort(9, "Caio", 0, 0, 0)])).toEqual([{ userId: 9, userName: "Caio", done: 0, open: 0, overdue: 0 }])
  })
})

describe("isDashboardEmpty", () => {
  const empty: AnalyticsDashboard = {
    lastRefreshAt: null,
    summary: {
      budgetPlanned: 0,
      budgetExecuted: 0,
      budgetConsumedPct: null,
      totalStages: 0,
      doneStages: 0,
      completionPct: null,
      totalTasks: 0,
      doneTasks: 0,
      overdueTasks: 0,
      avgDeviationDays30d: null,
    },
    budgetMonthly: [],
    expensesByCategory: [],
    burndown: [],
    overdueStages: [],
    memberEffort: [],
  }

  it("é vazio sem etapas, tarefas, orçamento nem equipe", () => {
    expect(isDashboardEmpty(empty)).toBe(true)
  })

  it("deixa de ser vazio com qualquer etapa", () => {
    expect(isDashboardEmpty({ ...empty, summary: { ...empty.summary, totalStages: 1 } })).toBe(false)
  })
})

describe("formatação", () => {
  it("mostra traço quando o percentual não existe", () => {
    expect(formatPercent(null)).toBe("—")
    expect(formatPercent(67.86)).toBe("68%")
  })

  it("lê a data pura no fuso local, sem recuar um dia", () => {
    expect(formatLocalDate("2026-10-19", "pt-BR")).toBe("19/10/2026")
  })
})
