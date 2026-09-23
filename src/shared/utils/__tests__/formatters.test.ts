import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatObraCode,
  stripExtension,
  todayIsoDate,
} from "../formatters"

/**
 * O `Intl` separa símbolo e número com espaço NÃO quebrável — U+00A0 no ICU
 * antigo, U+202F no novo. Os dois são invisíveis no diff e fariam a asserção
 * falhar por um caractere que ninguém vê, e qual deles aparece depende da
 * versão do Node. Normalizar por `\s` cobre os dois e deixa o teste falar de
 * conteúdo, não de bytes.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/\s/g, " ")
}

describe("formatDate", () => {
  // A data vem com hora ao meio-dia UTC de propósito: `new Date("2026-03-15")`
  // seria meia-noite UTC e viraria 14/03 em qualquer fuso negativo, deixando o
  // teste verde na máquina do dev e vermelho no CI (que roda em UTC).
  it("formata ISO no padrão brasileiro", () => {
    expect(formatDate("2026-03-15T12:00:00Z")).toBe("15/03/2026")
  })

  it("preserva o dia quando o mês tem um dígito", () => {
    expect(formatDate("2026-01-05T12:00:00Z")).toBe("05/01/2026")
  })
})

describe("stripExtension", () => {
  it("remove a extensão do nome do arquivo", () => {
    expect(stripExtension("planta-baixa.pdf")).toBe("planta-baixa")
  })

  // O padrão é ancorado no fim, então só a ÚLTIMA extensão cai — nome de
  // arquivo com ponto no meio não pode ser truncado.
  it("remove só a última extensão", () => {
    expect(stripExtension("memorial.v2.docx")).toBe("memorial.v2")
  })

  it("devolve o nome intacto quando não há extensão", () => {
    expect(stripExtension("CONTRATO")).toBe("CONTRATO")
  })

  it("não quebra com string vazia", () => {
    expect(stripExtension("")).toBe("")
  })
})

describe("formatCurrency", () => {
  it("formata em real com duas casas", () => {
    expect(normalizeSpaces(formatCurrency(1234.5))).toBe("R$ 1.234,50")
  })

  it("formata zero", () => {
    expect(normalizeSpaces(formatCurrency(0))).toBe("R$ 0,00")
  })

  it("mantém o sinal em valores negativos", () => {
    expect(normalizeSpaces(formatCurrency(-99.9))).toBe("-R$ 99,90")
  })

  it("aceita outra moeda", () => {
    expect(normalizeSpaces(formatCurrency(10, "USD"))).toContain("US$")
  })
})

describe("formatCompactCurrency", () => {
  // O KPI de orçamento usa a forma compacta para caber no card; se ela voltar
  // a escrever o número inteiro, o layout quebra em obra de milhão.
  it("abrevia milhares", () => {
    expect(normalizeSpaces(formatCompactCurrency(1_500_000))).toMatch(/1,5\s?mi/)
  })

  it("mantém valores pequenos legíveis", () => {
    expect(normalizeSpaces(formatCompactCurrency(250))).toContain("250")
  })
})

describe("todayIsoDate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Construtor com componentes locais, não string ISO: o formato de saída é
  // montado a partir de getFullYear/getMonth/getDate, que também são locais.
  it("devolve a data local no formato yyyy-MM-dd", () => {
    vi.setSystemTime(new Date(2026, 2, 15, 10, 30))

    expect(todayIsoDate()).toBe("2026-03-15")
  })

  it("preenche mês e dia com zero à esquerda", () => {
    vi.setSystemTime(new Date(2026, 0, 5, 23, 59))

    expect(todayIsoDate()).toBe("2026-01-05")
  })
})

describe("formatObraCode", () => {
  it("preenche o id até quatro dígitos", () => {
    expect(formatObraCode(142)).toBe("OBRA-0142")
  })

  it("não trunca id com mais de quatro dígitos", () => {
    expect(formatObraCode(123456)).toBe("OBRA-123456")
  })
})
