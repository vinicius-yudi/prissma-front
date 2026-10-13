import { describe, expect, it } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"

import { failedFields, fieldError } from "@/test/zod"

import { STAGE_FORM_DEFAULTS, stageSchema } from "../stageSchema"

/**
 * Etapa e tarefa têm regras de data quase iguais, mas não idênticas: etapa
 * aceita começar e terminar no mesmo dia (concretagem de um dia é uma etapa),
 * enquanto obra exige término posterior. Testar as duas juntas deixa a
 * diferença visível em vez de parecer descuido.
 */

const etapaValida = {
  name: "Fundação",
  description: "Sapatas e baldrames",
  displayOrder: 1,
  status: EtapaStatus.PLANNED,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-03-20",
}


describe("stageSchema", () => {
  it("aceita etapa válida", () => {
    expect(stageSchema.safeParse(etapaValida).success).toBe(true)
  })

  it("aceita etapa sem descrição", () => {
    const { description: _ignorado, ...semDescricao } = etapaValida

    expect(stageSchema.safeParse(semDescricao).success).toBe(true)
  })

  it("exige nome", () => {
    expect(fieldError(stageSchema, { ...etapaValida, name: "" }, "name")).toBe("obra.etapas.form.errors.nameRequired")
  })

  // A ordem é 1-based porque alimenta o `displayOrder` do backend e o número
  // que aparece no card. Zero deixaria a primeira etapa sem rótulo.
  it("exige ordem inteira e positiva", () => {
    expect(fieldError(stageSchema, { ...etapaValida, displayOrder: 0 }, "displayOrder")).toBe("obra.etapas.form.errors.orderInvalid")
    expect(stageSchema.safeParse({ ...etapaValida, displayOrder: 1.5 }).success).toBe(false)
  })

  it("aceita os quatro status de etapa", () => {
    for (const status of Object.values(EtapaStatus)) {
      expect(stageSchema.safeParse({ ...etapaValida, status }).success, status).toBe(true)
    }
  })

  it("exige as duas datas planejadas", () => {
    expect(fieldError(stageSchema, { ...etapaValida, plannedStartDate: "" }, "plannedStartDate")).toBe(
      "obra.etapas.form.errors.startRequired",
    )
    expect(fieldError(stageSchema, { ...etapaValida, plannedEndDate: "" }, "plannedEndDate")).toBe(
      "obra.etapas.form.errors.endRequired",
    )
  })

  it("rejeita término anterior ao início", () => {
    expect(fieldError(stageSchema, { ...etapaValida, plannedEndDate: "2026-02-01" }, "plannedEndDate")).toBe(
      "obra.etapas.form.errors.endBeforeStart",
    )
  })

  // Diferente da obra: etapa de um dia é comum e precisa passar.
  it("aceita etapa que começa e termina no mesmo dia", () => {
    expect(
      stageSchema.safeParse({ ...etapaValida, plannedEndDate: etapaValida.plannedStartDate }).success,
    ).toBe(true)
  })

  it("tem defaults que só falham nas datas ainda não preenchidas", () => {
    expect(failedFields(stageSchema, STAGE_FORM_DEFAULTS)).toEqual([
      "name",
      "plannedEndDate",
      "plannedStartDate",
    ])
  })
})
