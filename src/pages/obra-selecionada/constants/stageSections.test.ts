import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import { ALL_STAGES, COLUMN_STATUSES } from "./kanban"
import { STAGE_SECTIONS, sectionDroppableId, sectionStatusFromId } from "./stageSections"

/**
 * O arrastar-e-soltar da lista de etapas mistura dois tipos de alvo no mesmo
 * espaço: as etapas (id numérico) e as seções (id textual). Confundir os dois
 * é o que faz uma etapa "sumir" ao ser solta — vai para um droppable que não
 * existe. Estes testes fixam a fronteira entre eles.
 */

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

describe("sectionDroppableId", () => {
  it("prefixa o status", () => {
    expect(sectionDroppableId(EtapaStatus.IN_PROGRESS)).toBe("section:IN_PROGRESS")
  })

  // O id da seção não pode colidir com o de uma etapa, que é numérico.
  it("nunca gera algo que pareça id de etapa", () => {
    for (const status of STAGE_SECTIONS) {
      expect(Number.isNaN(Number(sectionDroppableId(status)))).toBe(true)
    }
  })
})

describe("sectionStatusFromId", () => {
  it("faz o caminho de volta de todos os status", () => {
    for (const status of STAGE_SECTIONS) {
      expect(sectionStatusFromId(sectionDroppableId(status))).toBe(status)
    }
  })

  it("devolve null para id numérico de etapa", () => {
    expect(sectionStatusFromId(42)).toBeNull()
    expect(sectionStatusFromId("42")).toBeNull()
  })

  it("devolve null para id sem o prefixo", () => {
    expect(sectionStatusFromId("IN_PROGRESS")).toBeNull()
  })

  // Prefixo certo com status inventado ainda é lixo: devolver o texto cru
  // faria a etapa ser salva com um status que o backend rejeita.
  it("devolve null quando o status depois do prefixo não existe", () => {
    expect(sectionStatusFromId("section:REVISAO")).toBeNull()
    expect(sectionStatusFromId("section:")).toBeNull()
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
