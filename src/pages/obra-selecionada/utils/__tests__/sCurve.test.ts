import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Expense } from "@/shared/types/budget"

import { moneyInput, parseMoney } from "../money"
import { CURVE_BOX, buildCurve } from "../sCurve"

function gasto(amount: number, spentAt: string): Expense {
  return {
    id: amount,
    budgetItemId: 1,
    stageId: null,
    description: "x",
    amount,
    supplier: null,
    receiptUrl: null,
    spentAt,
    createdAt: spentAt,
    categoryExceeded: false,
    budgetExceeded: false,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 6, 1, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("buildCurve", () => {
  const janela = { start: "2026-01-01", end: "2026-12-31" }

  it("sem janela válida não desenha", () => {
    expect(buildCurve({ start: null, end: "2026-12-31" }, 100, [])).toBeNull()
    expect(buildCurve({ start: "2026-12-31", end: "2026-01-01" }, 100, [])).toBeNull()
  })

  it("sobe em degraus a cada gasto e para em hoje", () => {
    const curva = buildCurve(janela, 1000, [gasto(300, "2026-03-01"), gasto(200, "2026-02-01")])
    expect(curva).not.toBeNull()
    if (!curva) return
    // M início + 2 pontos por gasto + hoje.
    expect(curva.actual.split("L")).toHaveLength(6)
    expect(curva.area.endsWith("Z")).toBe(true)
    expect(curva.nowX).toBeGreaterThan(CURVE_BOX.width / 2 - 20)
    expect(curva.months).toHaveLength(11)
    expect(curva.spentY).toBeLessThan(curva.valueAt(CURVE_BOX.left).planned + CURVE_BOX.height)
  })

  it("lê planejado e gasto numa data", () => {
    const curva = buildCurve(janela, 1000, [gasto(300, "2026-03-01")])
    if (!curva) throw new Error("sem curva")
    const inicio = curva.valueAt(CURVE_BOX.left)
    expect(inicio).toMatchObject({ planned: 0, spent: 0, future: false })
    const fim = curva.valueAt(CURVE_BOX.width - CURVE_BOX.right)
    expect(fim.planned).toBeCloseTo(1000)
    expect(fim.spent).toBe(300)
    expect(fim.future).toBe(true)
  })
})

describe("parseMoney", () => {
  it("lê o jeito brasileiro e o do servidor", () => {
    expect(parseMoney("1.234,56")).toBe(1234.56)
    expect(parseMoney("1234,5")).toBe(1234.5)
    expect(parseMoney("1234.5")).toBe(1234.5)
    expect(parseMoney("R$ 10")).toBe(10)
    expect(parseMoney(42)).toBe(42)
  })

  it("vazio vira NaN para o schema recusar", () => {
    expect(parseMoney("")).toBeNaN()
    expect(parseMoney(null)).toBeNaN()
  })

  it("formata para o campo", () => {
    expect(moneyInput(1234.5)).toBe("1234,50")
    expect(moneyInput(0)).toBe("")
  })
})
