import { describe, expect, it } from "vitest"

import { DONUT_COLORS, TONE_COLOR, donutColor } from "./budgetChartColors"

/**
 * As cores são referências a variáveis CSS de propósito: hex fixo congela o
 * gráfico no tema em que foi escrito, e era isso que acontecia — os gráficos
 * ficavam presos ao modo escuro quando o resto da tela clareava.
 */

describe("DONUT_COLORS", () => {
  it("usa só variáveis CSS, nunca cor literal", () => {
    for (const cor of DONUT_COLORS) {
      expect(cor, cor).toMatch(/^var\(--[\w-]+\)$/)
    }
  })

  it("não repete cor na rampa", () => {
    expect(new Set(DONUT_COLORS).size).toBe(DONUT_COLORS.length)
  })
})

describe("donutColor", () => {
  it("segue a ordem da rampa", () => {
    expect(donutColor(0)).toBe(DONUT_COLORS[0])
    expect(donutColor(2)).toBe(DONUT_COLORS[2])
  })

  // Obra com mais categorias que cores é comum; dar a volta é melhor que
  // devolver `undefined` e pintar a fatia de preto.
  it("dá a volta quando há mais categorias que cores", () => {
    expect(donutColor(DONUT_COLORS.length)).toBe(DONUT_COLORS[0])
    expect(donutColor(DONUT_COLORS.length + 3)).toBe(DONUT_COLORS[3])
  })
})

describe("TONE_COLOR", () => {
  it("cobre os três tons de orçamento", () => {
    expect(Object.keys(TONE_COLOR).sort()).toEqual(["exceeded", "ok", "warning"])
  })

  it("também usa só variáveis CSS", () => {
    for (const cor of Object.values(TONE_COLOR)) {
      expect(cor, cor).toMatch(/^var\(--[\w-]+\)$/)
    }
  })

  it("dá cores distintas a cada tom", () => {
    expect(new Set(Object.values(TONE_COLOR)).size).toBe(3)
  })
})
