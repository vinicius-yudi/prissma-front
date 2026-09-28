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
    expect(fieldError(budgetSchema, { plannedTotal: "1000" }, "plannedTotal")).toBe("Valor obrigatório")
  })

  // Total zerado é legítimo: a obra começa sem orçamento definido e o valor
  // entra depois. O que não pode é negativo.
  it("aceita zero e rejeita negativo", () => {
    expect(budgetSchema.safeParse({ plannedTotal: 0 }).success).toBe(true)
    expect(fieldError(budgetSchema, { plannedTotal: -1 }, "plannedTotal")).toBe("Valor deve ser positivo")
  })

  it("rejeita valor acima do limite do backend", () => {
    expect(fieldError(budgetSchema, { plannedTotal: 1e15 }, "plannedTotal")).toBe("Valor acima do limite")
  })

  it("limita a descrição a 255 caracteres", () => {
    expect(budgetSchema.safeParse({ description: "x".repeat(255), plannedTotal: 1 }).success).toBe(true)
    expect(fieldError(budgetSchema, { description: "x".repeat(256), plannedTotal: 1 }, "description")).toBe(
      "Máximo 255 caracteres",
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

    expect(fieldError(budgetItemSchema, data, "category")).toBe("Categoria obrigatória")
    expect(fieldError(budgetItemSchema, data, "description")).toBe("Descrição obrigatória")
  })

  it("limita a categoria a 100 caracteres", () => {
    const data = { category: "x".repeat(101), description: "ok", plannedAmount: 1 }

    expect(fieldError(budgetItemSchema, data, "category")).toBe("Máximo 100 caracteres")
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
      expenseSchema.safeParse({ description: "Areia", amount: 1, spentAt: "2026-03-15", stageId: null })
        .success,
    ).toBe(true)
  })

  // Diferente do orçamento: despesa de R$ 0 não é lançamento, é ruído na
  // lista — por isso `gt(0)` aqui e `nonnegative()` lá.
  it("rejeita valor zero", () => {
    expect(fieldError(expenseSchema, { ...valida, amount: 0 }, "amount")).toBe("Valor deve ser maior que zero")
  })

  it("exige data e valida o formato", () => {
    expect(fieldError(expenseSchema, { ...valida, spentAt: "" }, "spentAt")).toBe("Data obrigatória")
    expect(fieldError(expenseSchema, { ...valida, spentAt: "15/03/2026" }, "spentAt")).toBe("Data inválida")
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
      "URL deve começar com http:// ou https://",
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
      "spentAt",
    ])
  })
})
