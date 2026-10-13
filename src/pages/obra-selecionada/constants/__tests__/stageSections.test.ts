import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import { COLUMN_STATUSES, TASK_STATUS } from "../kanban"
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
  it("segue o fluxo, com bloqueada antes de concluída", () => {
    expect(COLUMN_STATUSES).toEqual(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"])
  })

  it("cobre todos os status de tarefa", () => {
    expect([...COLUMN_STATUSES].sort()).toEqual(Object.values(TASK_STATUS).sort())
  })
})
