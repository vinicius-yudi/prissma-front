import { describe, expect, it } from "vitest"

import { calculatePercent, projectEnd, resolveBudgetTone } from "../budgetMath"

/**
 * Estes dois decidem a cor da barra, do KPI e do banner de estouro. O tom é a
 * única sinalização de que a obra passou do orçado, então as fronteiras (80 e
 * 100) importam mais que o meio da escala.
 */

describe("calculatePercent", () => {
  it("calcula a fração gasta do planejado", () => {
    expect(calculatePercent(50, 200)).toBe(25)
    expect(calculatePercent(200, 200)).toBe(100)
  })

  it("passa de 100 quando o gasto excede o planejado", () => {
    expect(calculatePercent(300, 200)).toBe(150)
  })

  // Categoria criada sem valor planejado: qualquer gasto nela já é estouro
  // total, e mostrar 0% esconderia exatamente o problema.
  it("devolve 100 quando não há planejado mas há gasto", () => {
    expect(calculatePercent(10, 0)).toBe(100)
    expect(calculatePercent(10, -5)).toBe(100)
  })

  it("devolve 0 quando não há planejado nem gasto", () => {
    expect(calculatePercent(0, 0)).toBe(0)
  })

  it("devolve 0 quando nada foi gasto", () => {
    expect(calculatePercent(0, 200)).toBe(0)
  })
})

describe("resolveBudgetTone", () => {
  it("é 'ok' até 85% (DS v2)", () => {
    expect(resolveBudgetTone(0)).toBe("ok")
    expect(resolveBudgetTone(85)).toBe("ok")
  })

  it("vira 'warning' acima de 85%", () => {
    expect(resolveBudgetTone(85.1)).toBe("warning")
    expect(resolveBudgetTone(100)).toBe("warning")
  })

  // 100% cravado ainda não é estouro — é o orçamento cumprido à risca.
  it("só vira 'exceeded' acima de 100%", () => {
    expect(resolveBudgetTone(100.01)).toBe("exceeded")
    expect(resolveBudgetTone(150)).toBe("exceeded")
  })

  // O backend marca o estouro em campo próprio; ele manda mesmo quando o
  // percentual arredonda para baixo do limite.
  it("respeita a flag de estouro vinda do backend", () => {
    expect(resolveBudgetTone(10, true)).toBe("exceeded")
    expect(resolveBudgetTone(0, true)).toBe("exceeded")
  })

  it("ignora a flag quando ela vem falsa", () => {
    expect(resolveBudgetTone(10, false)).toBe("ok")
  })
})

describe("projectEnd", () => {
  it("não projeta sem avanço, abaixo de 12% ou sem orçado", () => {
    expect(projectEnd(100, 1000, null)).toBeNull()
    expect(projectEnd(100, 1000, 11)).toBeNull()
    expect(projectEnd(100, 0, 50)).toBeNull()
  })

  it("projeta gasto ÷ avanço e diz para que lado vai", () => {
    expect(projectEnd(600, 1000, 50)).toMatchObject({ value: 1200, trend: "above" })
    expect(projectEnd(400, 1000, 50)).toMatchObject({ value: 800, trend: "below" })
    expect(projectEnd(510, 1000, 50)?.trend).toBe("within")
  })
})
