import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import { ALL_STAGES, COLUMN_STATUSES } from "../kanban"
import { STAGE_SECTIONS } from "../stageSections"

/** Ordem dos status nos seletores de etapa e nas colunas do quadro de tarefas. */

describe("STAGE_SECTIONS", () => {
  it("segue o fluxo da obra, com bloqueada por último", () => {
    expect(STAGE_SECTIONS).toEqual([
      EtapaStatus.PLANNED,
      EtapaStatus.IN_PROGRESS,
      EtapaStatus.DONE,
      EtapaStatus.BLOCKED,
    ])
  })

  it("cobre todos os status de etapa", () => {
    expect([...STAGE_SECTIONS].sort()).toEqual(Object.values(EtapaStatus).sort())
  })
})

describe("colunas do kanban de tarefas", () => {
  it("segue o fluxo, com bloqueada por último", () => {
    expect(COLUMN_STATUSES).toEqual(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"])
  })

  it("usa um valor de filtro que não colide com status nenhum", () => {
    expect(COLUMN_STATUSES).not.toContain(ALL_STAGES)
    expect(STAGE_SECTIONS).not.toContain(ALL_STAGES as EtapaStatus)
  })
})
