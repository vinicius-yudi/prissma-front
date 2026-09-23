import { describe, expect, it } from "vitest"

import { DayState, type DaySchedule } from "../../types/schedule"
import {
  dayStateOf,
  formatDayOfMonth,
  formatFullDate,
  formatHours,
  formatMonthLabel,
  formatWeekdayShort,
  initialsOf,
  isWeekend,
  parseIsoDate,
  weekRangeLabel,
} from "../scheduleFormat"

const PT = "pt-BR"

function dia(over: Partial<DaySchedule> = {}): DaySchedule {
  return {
    date: "2026-08-10",
    allocatedHours: 0,
    allocated: false,
    overlapped: false,
    tasks: [],
    ...over,
  }
}

describe("parseIsoDate", () => {
  /**
   * O motivo de este módulo existir. `new Date("2026-08-10")` é meia-noite UTC
   * e, em qualquer fuso negativo, cai no dia 9 — a grade inteira andaria uma
   * coluna para trás sem nenhum erro aparecer.
   */
  it("lê a data no fuso local, não em UTC", () => {
    const date = parseIsoDate("2026-08-10")

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7)
    expect(date.getDate()).toBe(10)
  })
})

describe("isWeekend", () => {
  it("marca sábado e domingo", () => {
    expect(isWeekend("2026-08-15")).toBe(true)
    expect(isWeekend("2026-08-16")).toBe(true)
  })

  it("não marca dia útil", () => {
    expect(isWeekend("2026-08-10")).toBe(false)
    expect(isWeekend("2026-08-14")).toBe(false)
  })
})

describe("rótulos de coluna", () => {
  it("usa dia da semana abreviado sem ponto, como no protótipo", () => {
    expect(formatWeekdayShort("2026-08-10", PT)).toBe("Seg 10")
  })

  it("usa só o número do dia no mês", () => {
    expect(formatDayOfMonth("2026-08-10")).toBe("10")
  })

  it("monta a data por extenso do aria-label", () => {
    expect(formatFullDate("2026-08-10", PT)).toBe("10/08/2026")
  })

  it("monta o rótulo do período da navegação", () => {
    expect(formatMonthLabel("2026-08-10", PT)).toBe("Agosto 2026")
  })
})

describe("weekRangeLabel", () => {
  it("usa a forma curta quando a semana cabe num mês só", () => {
    expect(weekRangeLabel("2026-08-10", "2026-08-16", PT)).toEqual({
      key: "week",
      values: { start: "10", end: "16", month: "ago", year: "2026" },
    })
  })

  // "Semana de 31 a 6 ago 2026" diria o mês errado em metade das colunas.
  it("abre o mês nas duas pontas quando a semana atravessa", () => {
    expect(weekRangeLabel("2026-08-31", "2026-09-06", PT)).toEqual({
      key: "weekSpan",
      values: { start: "31 ago", end: "6 set 2026" },
    })
  })

  it("abre também o ano quando a semana vira o ano", () => {
    expect(weekRangeLabel("2025-12-29", "2026-01-04", PT)).toEqual({
      key: "weekSpan",
      values: { start: "29 dez 2025", end: "4 jan 2026" },
    })
  })
})

describe("formatHours", () => {
  // O BigDecimal do backend chega como 8 para 8.00; o protótipo escreve "8h".
  it("não arrasta zero à direita", () => {
    expect(formatHours(8, PT)).toBe("8h")
  })

  it("mostra a fração com o separador do idioma", () => {
    expect(formatHours(7.5, PT)).toBe("7,5h")
    expect(formatHours(7.5, "en-US")).toBe("7.5h")
  })
})

describe("dayStateOf", () => {
  it("dia sem alocação é livre", () => {
    expect(dayStateOf(dia())).toBe(DayState.FREE)
  })

  it("dia alocado sem conflito é alocado", () => {
    expect(dayStateOf(dia({ allocated: true, allocatedHours: 8 }))).toBe(DayState.ALLOCATED)
  })

  it("dia alocado com mais de uma tarefa é sobreposição", () => {
    expect(dayStateOf(dia({ allocated: true, allocatedHours: 8, overlapped: true }))).toBe(
      DayState.OVERLAP,
    )
  })
})

describe("initialsOf", () => {
  it("usa primeiro e último nome", () => {
    expect(initialsOf("João Souza")).toBe("JS")
    expect(initialsOf("Maria da Silva Reis")).toBe("MR")
  })

  it("aceita nome único", () => {
    expect(initialsOf("Ana")).toBe("A")
  })

  it("não quebra com nome vazio", () => {
    expect(initialsOf("   ")).toBe("?")
  })
})
