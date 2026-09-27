import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import { STAGE_FORM_DEFAULTS, type StageFormData } from "../../schemas/stageSchema"
import type { Stage } from "../../services/stages.service"
import { stageChronologyError, toDateInput } from "../stageChronology"

function dados(over: Partial<StageFormData> = {}): StageFormData {
  return { ...STAGE_FORM_DEFAULTS, name: "Alvenaria", displayOrder: 2, plannedStartDate: "2026-03-01", ...over }
}

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 9,
    constructionProjectId: 7,
    name: "Fundação",
    description: null,
    displayOrder: 1,
    status: EtapaStatus.DONE,
    plannedStartDate: "2026-01-01T00:00:00Z",
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

describe("toDateInput", () => {
  it("recorta a hora e aceita vazio", () => {
    expect(toDateInput("2026-03-01T10:00:00Z")).toBe("2026-03-01")
    expect(toDateInput(null)).toBe("")
    expect(toDateInput(undefined)).toBe("")
  })
})

describe("stageChronologyError", () => {
  it("não opina sem data de início", () => {
    const erro = stageChronologyError({
      data: dados({ plannedStartDate: "  " }),
      stageId: null,
      stages: [etapa({ plannedStartDate: null })],
      projectStartDate: "2027-01-01",
    })

    expect(erro).toBeNull()
  })

  it("aceita quando começa depois da obra e da anterior", () => {
    const erro = stageChronologyError({
      data: dados(),
      stageId: null,
      stages: [etapa()],
      projectStartDate: "2026-01-01",
    })

    expect(erro).toBeNull()
  })

  it("aceita sem data de início da obra", () => {
    const erro = stageChronologyError({ data: dados({ displayOrder: 1 }), stageId: null, stages: [etapa()], projectStartDate: null })

    expect(erro).toBeNull()
  })

  it("aponta cada regra com a chave do erro", () => {
    const base = { stageId: null, projectStartDate: null }

    expect(stageChronologyError({ ...base, data: dados(), stages: [], projectStartDate: "2026-06-01" })).toBe(
      "obra.etapas.toasts.startBeforeProject",
    )
    expect(stageChronologyError({ ...base, data: dados(), stages: [etapa({ plannedStartDate: null })] })).toBe(
      "obra.etapas.toasts.previousStartRequired",
    )
    expect(stageChronologyError({ ...base, data: dados(), stages: [etapa({ plannedStartDate: "2026-05-01" })] })).toBe(
      "obra.etapas.toasts.startBeforePrevious",
    )
  })
})
