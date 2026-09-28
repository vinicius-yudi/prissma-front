import { describe, expect, it } from "vitest"

import { toBudgetItemPayload, toBudgetPayload, toExpensePayload } from "../budgetPayload"

/**
 * A tradução formulário → payload existe por causa de um detalhe só: campo
 * opcional vazio precisa virar `null`, não `""`. O backend guarda a string
 * vazia como valor, e a tela passa a mostrar um fornecedor em branco em vez
 * de "sem fornecedor".
 */

describe("toBudgetPayload", () => {
  it("repassa o total planejado", () => {
    expect(toBudgetPayload({ description: "Casa térrea", plannedTotal: 250000 })).toEqual({
      description: "Casa térrea",
      plannedTotal: 250000,
    })
  })

  it("converte descrição vazia em null", () => {
    expect(toBudgetPayload({ description: "", plannedTotal: 1 }).description).toBeNull()
  })

  it("converte descrição só de espaços em null", () => {
    expect(toBudgetPayload({ description: "   ", plannedTotal: 1 }).description).toBeNull()
  })

  it("converte descrição ausente em null", () => {
    expect(toBudgetPayload({ plannedTotal: 1 }).description).toBeNull()
  })

  it("apara os espaços das pontas", () => {
    expect(toBudgetPayload({ description: "  Casa térrea  ", plannedTotal: 1 }).description).toBe(
      "Casa térrea",
    )
  })
})

describe("toBudgetItemPayload", () => {
  // Categoria e descrição são obrigatórias no schema, então aqui não há
  // conversão para null — o payload é uma cópia direta.
  it("repassa os três campos sem transformar", () => {
    expect(
      toBudgetItemPayload({ category: "Materiais", description: "Cimento CP-II", plannedAmount: 4800 }),
    ).toEqual({ category: "Materiais", description: "Cimento CP-II", plannedAmount: 4800 })
  })
})

describe("toExpensePayload", () => {
  const form = {
    description: "Areia média",
    amount: 320.5,
    spentAt: "2026-03-15",
    stageId: 7,
    supplier: "Depósito Central",
    receiptUrl: "https://recibos.exemplo/1",
  }

  it("repassa a despesa completa", () => {
    expect(toExpensePayload(form)).toEqual({
      description: "Areia média",
      amount: 320.5,
      spentAt: "2026-03-15",
      stageId: 7,
      supplier: "Depósito Central",
      receiptUrl: "https://recibos.exemplo/1",
    })
  })

  it("converte fornecedor e recibo vazios em null", () => {
    const payload = toExpensePayload({ ...form, supplier: "", receiptUrl: "  " })

    expect(payload.supplier).toBeNull()
    expect(payload.receiptUrl).toBeNull()
  })

  // Despesa sem etapa é despesa da obra como um todo — `undefined` viraria
  // campo ausente no JSON e o backend não limparia o vínculo anterior.
  it("normaliza etapa ausente para null", () => {
    expect(toExpensePayload({ ...form, stageId: null }).stageId).toBeNull()
  })

  it("apara os espaços do fornecedor", () => {
    expect(toExpensePayload({ ...form, supplier: "  Depósito  " }).supplier).toBe("Depósito")
  })
})
