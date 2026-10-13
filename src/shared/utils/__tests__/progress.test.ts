import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { lateStages, projectProgress, stageProgress } from "../progress"
import type { ProgressStage } from "../progress"

/** Etapa no formato do acompanhamento do backend: total e contagem por status. */
function etapa(over: Partial<ProgressStage> = {}): ProgressStage {
  return {
    status: "IN_PROGRESS",
    plannedStartDate: "2026-01-01",
    plannedEndDate: "2026-01-11",
    totalTarefas: 0,
    taskStatusCounts: {},
    ...over,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("stageProgress", () => {
  it.each([
    ["concluída", etapa({ status: "DONE" }), 100],
    ["em andamento sem tarefas", etapa(), 25],
    ["planejada sem tarefas", etapa({ status: "PLANNED" }), 0],
    // 1 feita (1) + 1 em andamento (0.4) de 4 = 35%.
    ["pelas tarefas", etapa({ totalTarefas: 4, taskStatusCounts: { DONE: 1, IN_PROGRESS: 1, TODO: 2 } }), 35],
    // Contagem sem as chaves (payload parcial) não quebra: conta como zero.
    ["com contagem vazia", etapa({ totalTarefas: 3, taskStatusCounts: {} }), 0],
  ])("mede a etapa %s", (_caso, stage, esperado) => {
    expect(stageProgress(stage)).toBe(esperado)
  })
})

describe("projectProgress", () => {
  it("é zero sem etapas", () => {
    expect(projectProgress([])).toBe(0)
  })

  // A etapa de 30 dias pesa três vezes a de 10.
  it("pondera as etapas pela duração planejada", () => {
    const curta = etapa({ status: "DONE", plannedEndDate: "2026-01-11" })
    const longa = etapa({ status: "PLANNED", plannedStartDate: "2026-01-11", plannedEndDate: "2026-02-10" })

    expect(projectProgress([curta, longa])).toBe(25)
  })

  it("trata etapa sem datas como peso mínimo", () => {
    expect(projectProgress([etapa({ status: "DONE", plannedStartDate: null, plannedEndDate: null })])).toBe(100)
  })
})

describe("lateStages", () => {
  it("conta as etapas vencidas e não concluídas", () => {
    const stages = [
      etapa({ plannedEndDate: "2026-06-01" }),
      etapa({ status: "DONE", plannedEndDate: "2026-05-01" }),
      etapa({ plannedEndDate: "2026-07-01" }),
    ]

    expect(lateStages(stages)).toBe(1)
  })
})
