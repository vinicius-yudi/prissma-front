import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import type { Stage } from "../../services/stages.service"
import {
  averageStageProgress,
  countDoneStages,
  currentStage,
  stageProgress,
} from "../stageProgress"

/**
 * Este módulo nasceu de uma duplicação: o `EtapaCard` tinha um `switch` e a
 * Visão geral um `Record`, e as duas telas mostravam números diferentes para
 * a mesma etapa. Os testes fixam o contrato único.
 */

let proximoId = 1

function etapa(status: EtapaStatus, nome = `Etapa ${proximoId}`): Stage {
  return {
    id: proximoId++,
    constructionProjectId: 1,
    name: nome,
    description: null,
    displayOrder: proximoId,
    status,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

describe("stageProgress", () => {
  it("traduz cada status em percentual", () => {
    expect(stageProgress(etapa(EtapaStatus.PLANNED))).toBe(0)
    expect(stageProgress(etapa(EtapaStatus.IN_PROGRESS))).toBe(50)
    expect(stageProgress(etapa(EtapaStatus.DONE))).toBe(100)
  })

  // Bloqueada não é "meio pronta": ela parou, e mostrar 50% daria a impressão
  // de que ainda anda.
  it("zera etapa bloqueada", () => {
    expect(stageProgress(etapa(EtapaStatus.BLOCKED))).toBe(0)
  })

  it("cai em 0 para status desconhecido", () => {
    expect(stageProgress({ ...etapa(EtapaStatus.PLANNED), status: "REVISAO" as EtapaStatus })).toBe(0)
  })
})

describe("averageStageProgress", () => {
  it("devolve 0 para obra sem etapas", () => {
    expect(averageStageProgress([])).toBe(0)
  })

  it("faz a média dos percentuais", () => {
    expect(
      averageStageProgress([etapa(EtapaStatus.DONE), etapa(EtapaStatus.PLANNED)]),
    ).toBe(50)
  })

  it("arredonda o resultado", () => {
    // 100 + 50 + 0 = 150 / 3 = 50; com quatro etapas dá 37,5 → 38.
    expect(
      averageStageProgress([
        etapa(EtapaStatus.DONE),
        etapa(EtapaStatus.IN_PROGRESS),
        etapa(EtapaStatus.PLANNED),
        etapa(EtapaStatus.PLANNED),
      ]),
    ).toBe(38)
  })

  it("devolve 100 quando tudo está concluído", () => {
    expect(averageStageProgress([etapa(EtapaStatus.DONE), etapa(EtapaStatus.DONE)])).toBe(100)
  })
})

describe("currentStage", () => {
  it("devolve null para obra sem etapas", () => {
    expect(currentStage([])).toBeNull()
  })

  it("prefere a primeira em andamento", () => {
    const emAndamento = etapa(EtapaStatus.IN_PROGRESS, "Fundação")
    const stages = [etapa(EtapaStatus.DONE), emAndamento, etapa(EtapaStatus.IN_PROGRESS)]

    expect(currentStage(stages)).toBe(emAndamento)
  })

  // Sem nada em andamento, a obra está parada na próxima pendência — inclusive
  // se ela estiver bloqueada, que é o caso em que o usuário mais precisa ver.
  it("cai na primeira não concluída quando nada está em andamento", () => {
    const bloqueada = etapa(EtapaStatus.BLOCKED, "Laje")
    const stages = [etapa(EtapaStatus.DONE), bloqueada, etapa(EtapaStatus.PLANNED)]

    expect(currentStage(stages)).toBe(bloqueada)
  })

  it("devolve null quando todas estão concluídas", () => {
    expect(currentStage([etapa(EtapaStatus.DONE), etapa(EtapaStatus.DONE)])).toBeNull()
  })
})

describe("countDoneStages", () => {
  it("conta só as concluídas", () => {
    const stages = [
      etapa(EtapaStatus.DONE),
      etapa(EtapaStatus.DONE),
      etapa(EtapaStatus.IN_PROGRESS),
      etapa(EtapaStatus.BLOCKED),
    ]

    expect(countDoneStages(stages)).toBe(2)
  })

  it("devolve 0 sem etapas", () => {
    expect(countDoneStages([])).toBe(0)
  })
})
