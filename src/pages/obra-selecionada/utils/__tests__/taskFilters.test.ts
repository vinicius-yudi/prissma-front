import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Tarefa, TarefaComEtapa } from "../../types/tarefas"
import { quickAddDates } from "../taskDates"
import { filterTasks, groupByStatus, hasActiveFilters, isTaskLate, normalizeText, recentDone, type TaskFilters } from "../taskFilters"

function item(id: number, over: Partial<Tarefa> = {}, stageId = 1): TarefaComEtapa {
  return {
    stageId,
    stageName: `Etapa ${stageId}`,
    tarefa: {
      id,
      title: `Tarefa ${id}`,
      description: "",
      priority: "MEDIUM",
      status: "TODO",
      plannedStartDate: "2026-03-01",
      plannedEndDate: "2099-12-31",
      assigneeUserId: null,
      assigneeName: null,
      constructionProjectId: 7,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      ...over,
    },
  }
}

const NONE: TaskFilters = { stageId: null, mine: false, onlyLate: false, query: "" }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("filterTasks", () => {
  const items = [
    item(1, { title: "Concretar fundação", assigneeUserId: 5 }),
    item(2, { title: "Alvenaria", plannedEndDate: "2026-06-01" }, 2),
    item(3, { title: "Pintura", plannedEndDate: "2026-06-01", status: "DONE" }, 2),
  ]

  it("sem filtro devolve tudo", () => {
    expect(filterTasks(items, NONE, null)).toHaveLength(3)
    expect(hasActiveFilters(NONE)).toBe(false)
  })

  it("busca sem acento nem caixa", () => {
    const found = filterTasks(items, { ...NONE, query: "FUNDACAO" }, null)
    expect(found.map((i) => i.tarefa.id)).toEqual([1])
    expect(normalizeText("Ação")).toBe("acao")
  })

  it("filtra por etapa, minhas e atrasadas", () => {
    expect(filterTasks(items, { ...NONE, stageId: 2 }, null).map((i) => i.tarefa.id)).toEqual([2, 3])
    expect(filterTasks(items, { ...NONE, mine: true }, 5).map((i) => i.tarefa.id)).toEqual([1])
    expect(filterTasks(items, { ...NONE, mine: true }, null)).toEqual([])
    // Concluída com prazo vencido não é atraso.
    expect(filterTasks(items, { ...NONE, onlyLate: true }, null).map((i) => i.tarefa.id)).toEqual([2])
    expect(hasActiveFilters({ ...NONE, query: " x " })).toBe(true)
  })

  it("isTaskLate só olha tarefa aberta com prazo vencido", () => {
    expect(isTaskLate({ status: "TODO", plannedEndDate: "2026-06-14" })).toBe(true)
    expect(isTaskLate({ status: "TODO", plannedEndDate: "2026-06-15" })).toBe(false)
    expect(isTaskLate({ status: "DONE", plannedEndDate: "2026-01-01" })).toBe(false)
  })
})

describe("colunas", () => {
  it("agrupa por status", () => {
    const groups = groupByStatus([item(1), item(2, { status: "BLOCKED" })])
    expect(groups.TODO).toHaveLength(1)
    expect(groups.BLOCKED).toHaveLength(1)
    expect(groups.DONE).toEqual([])
  })

  it("mostra as cinco concluídas mais recentes, ou todas", () => {
    const done = [1, 2, 3, 4, 5, 6, 7].map((id) => item(id, { status: "DONE", updatedAt: `2026-01-0${id}T00:00:00Z` }))
    expect(recentDone(done, false).map((i) => i.tarefa.id)).toEqual([7, 6, 5, 4, 3])
    expect(recentDone(done, true)).toHaveLength(7)
  })
})

describe("quickAddDates", () => {
  it("começa hoje e vence em N dias", () => {
    expect(quickAddDates("2026-01-01", 7)).toEqual({ plannedStartDate: "2026-06-15", plannedEndDate: "2026-06-22" })
    expect(quickAddDates(null, 7).plannedStartDate).toBe("2026-06-15")
  })

  it("não nasce antes do início da etapa", () => {
    expect(quickAddDates("2026-08-30T00:00:00Z", 3)).toEqual({ plannedStartDate: "2026-08-30", plannedEndDate: "2026-09-02" })
  })
})
