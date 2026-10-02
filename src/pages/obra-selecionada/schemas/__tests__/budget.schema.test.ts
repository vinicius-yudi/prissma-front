import { describe, expect, it } from "vitest"

import { failedFields, fieldError } from "@/test/zod"

import {
  BUDGET_FORM_DEFAULTS,
  BUDGET_ITEM_FORM_DEFAULTS,
  EXPENSE_FORM_DEFAULTS,
  budgetItemSchema,
  budgetSchema,
  expenseSchema,
} from "../budget.schema"

describe("budgetSchema", () => {
  it("aceita orçamento válido", () => {
    expect(budgetSchema.safeParse({ description: "Obra completa", plannedTotal: 150000 }).success).toBe(true)
  })

  it("aceita sem descrição", () => {
    expect(budgetSchema.safeParse({ plannedTotal: 1000 }).success).toBe(true)
  })

  it("exige um número no total planejado", () => {
    expect(fieldError(budgetSchema, { plannedTotal: "1000" }, "plannedTotal")).toBe("obra.orcamento.validation.amountRequired")
  })

  // Total zerado é legítimo: a obra começa sem orçamento definido e o valor
  // entra depois. O que não pode é negativo.
  it("aceita zero e rejeita negativo", () => {
    expect(budgetSchema.safeParse({ plannedTotal: 0 }).success).toBe(true)
    expect(fieldError(budgetSchema, { plannedTotal: -1 }, "plannedTotal")).toBe("obra.orcamento.validation.amountPositive")
  })

  it("rejeita valor acima do limite do backend", () => {
    expect(fieldError(budgetSchema, { plannedTotal: 1e15 }, "plannedTotal")).toBe("obra.orcamento.validation.amountTooHigh")
  })

  it("limita a descrição a 255 caracteres", () => {
    expect(budgetSchema.safeParse({ description: "x".repeat(255), plannedTotal: 1 }).success).toBe(true)
    expect(fieldError(budgetSchema, { description: "x".repeat(256), plannedTotal: 1 }, "description")).toBe(
      "obra.orcamento.validation.tooLong",
    )
  })

  // Os defaults alimentam o `useForm`; se deixarem de casar com o schema, o
  // formulário abre já inválido e o botão de salvar nasce desabilitado.
  it("tem defaults compatíveis com o próprio schema", () => {
    expect(budgetSchema.safeParse(BUDGET_FORM_DEFAULTS).success).toBe(true)
  })
})

describe("budgetItemSchema", () => {
  it("aceita item válido", () => {
    expect(
      budgetItemSchema.safeParse({ category: "Materiais", description: "Cimento", plannedAmount: 500 })
        .success,
    ).toBe(true)
  })

  it("exige categoria e descrição", () => {
    const data = { category: "", description: "", plannedAmount: 1 }

    expect(fieldError(budgetItemSchema, data, "category")).toBe("obra.orcamento.validation.categoryRequired")
    expect(fieldError(budgetItemSchema, data, "description")).toBe("obra.orcamento.validation.descriptionRequired")
  })

  it("limita a categoria a 100 caracteres", () => {
    const data = { category: "x".repeat(101), description: "ok", plannedAmount: 1 }

    expect(fieldError(budgetItemSchema, data, "category")).toBe("obra.orcamento.validation.tooLong")
  })

  it("tem defaults que só falham nos campos obrigatórios", () => {
    expect(failedFields(budgetItemSchema, BUDGET_ITEM_FORM_DEFAULTS)).toEqual([
      "category",
      "description",
    ])
  })
})

describe("expenseSchema", () => {
  const valida = {
    description: "Areia média",
    itemId: 3,
    amount: 320.5,
    spentAt: "2026-03-15",
    stageId: null,
    supplier: "Depósito Central",
    receiptUrl: "https://recibos.exemplo/1",
  }

  it("aceita despesa completa", () => {
    expect(expenseSchema.safeParse(valida).success).toBe(true)
  })

  it("aceita sem fornecedor nem recibo", () => {
    expect(
      expenseSchema.safeParse({ itemId: 3, description: "Areia", amount: 1, spentAt: "2026-03-15", stageId: null })
        .success,
    ).toBe(true)
  })

  // Diferente do orçamento: despesa de R$ 0 não é lançamento, é ruído na
  // lista — por isso `gt(0)` aqui e `nonnegative()` lá.
  it("rejeita valor zero", () => {
    expect(fieldError(expenseSchema, { ...valida, amount: 0 }, "amount")).toBe("obra.orcamento.validation.amountAboveZero")
  })

  it("exige data e valida o formato", () => {
    expect(fieldError(expenseSchema, { ...valida, spentAt: "" }, "spentAt")).toBe("obra.orcamento.validation.dateRequired")
    expect(fieldError(expenseSchema, { ...valida, spentAt: "15/03/2026" }, "spentAt")).toBe("obra.orcamento.validation.dateInvalid")
  })

  it("aceita despesa vinculada a uma etapa", () => {
    expect(expenseSchema.safeParse({ ...valida, stageId: 12 }).success).toBe(true)
  })

  it("rejeita id de etapa inválido", () => {
    expect(expenseSchema.safeParse({ ...valida, stageId: 0 }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...valida, stageId: 1.5 }).success).toBe(false)
  })

  // O link do recibo vira `href`; sem esquema, `javascript:` passaria adiante.
  it("exige http ou https no recibo", () => {
    expect(fieldError(expenseSchema, { ...valida, receiptUrl: "recibos.exemplo/1" }, "receiptUrl")).toBe(
      "obra.orcamento.validation.urlInvalid",
    )
    expect(expenseSchema.safeParse({ ...valida, receiptUrl: "HTTP://recibos.exemplo" }).success).toBe(true)
  })

  it("aceita recibo em branco", () => {
    expect(expenseSchema.safeParse({ ...valida, receiptUrl: "" }).success).toBe(true)
  })

  it("tem defaults que só falham nos campos obrigatórios", () => {
    expect(failedFields(expenseSchema, EXPENSE_FORM_DEFAULTS)).toEqual([
      "amount",
      "description",
      "itemId",
      "spentAt",
    ])
  })
})
