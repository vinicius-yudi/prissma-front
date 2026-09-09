import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { dateProgress, daysLate, deriveStatus } from "../status"

/**
 * Datas escritas SEM sufixo `Z` de propósito: `new Date("2026-03-15")` é
 * meia-noite UTC, e o módulo normaliza com `setHours(0,0,0,0)` — local. Em
 * fuso negativo os dois discordam em um dia e o teste passaria a depender de
 * onde roda. `"2026-03-15T00:00:00"` é parseado como local em qualquer fuso.
 */
const HOJE = new Date(2026, 2, 20, 10, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(HOJE)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("daysLate", () => {
  it("devolve 0 sem data planejada", () => {
    expect(daysLate(null)).toBe(0)
    expect(daysLate(undefined)).toBe(0)
    expect(daysLate("")).toBe(0)
  })

  it("devolve 0 para data inválida", () => {
    expect(daysLate("não é data")).toBe(0)
  })

  it("devolve 0 quando o prazo é no futuro", () => {
    expect(daysLate("2026-03-25T00:00:00")).toBe(0)
  })

  // Vencer HOJE ainda não é atraso: o dia de entrega inteiro é do usuário.
  it("devolve 0 quando o prazo é hoje", () => {
    expect(daysLate("2026-03-20T00:00:00")).toBe(0)
  })

  it("conta os dias corridos além do prazo", () => {
    expect(daysLate("2026-03-15T00:00:00")).toBe(5)
  })

  it("conta 1 no dia seguinte ao vencimento", () => {
    expect(daysLate("2026-03-19T00:00:00")).toBe(1)
  })
})

describe("dateProgress", () => {
  it("devolve 0 quando falta alguma das pontas", () => {
    expect(dateProgress(null, "2026-03-30T00:00:00")).toBe(0)
    expect(dateProgress("2026-03-01T00:00:00", null)).toBe(0)
    expect(dateProgress(undefined, undefined)).toBe(0)
  })

  it("devolve 0 para datas inválidas", () => {
    expect(dateProgress("qualquer coisa", "2026-03-30T00:00:00")).toBe(0)
  })

  // Janela invertida é dado ruim, não 100%: mostrar barra cheia esconderia o
  // erro de cadastro em vez de deixá-lo aparecer.
  it("devolve 0 quando o fim é anterior ao início", () => {
    expect(dateProgress("2026-03-30T00:00:00", "2026-03-01T00:00:00")).toBe(0)
  })

  it("devolve 0 quando início e fim são iguais", () => {
    expect(dateProgress("2026-03-01T00:00:00", "2026-03-01T00:00:00")).toBe(0)
  })

  it("calcula o percentual decorrido da janela", () => {
    // 10/03 a 30/03 = 20 dias; hoje é 20/03 às 10h → metade da janela mais 10h.
    expect(dateProgress("2026-03-10T00:00:00", "2026-03-30T00:00:00")).toBe(52)
  })

  it("trava em 0 antes do início", () => {
    expect(dateProgress("2026-04-01T00:00:00", "2026-04-30T00:00:00")).toBe(0)
  })

  it("trava em 100 depois do fim", () => {
    expect(dateProgress("2026-01-01T00:00:00", "2026-02-01T00:00:00")).toBe(100)
  })
})

describe("deriveStatus", () => {
  it("traduz os status de conclusão dos três vocabulários", () => {
    expect(deriveStatus({ status: "COMPLETED" }).state).toBe("done")
    expect(deriveStatus({ status: "DONE" }).state).toBe("done")
  })

  it("traduz andamento", () => {
    expect(deriveStatus({ status: "IN_PROGRESS" }).state).toBe("progress")
  })

  it("trata pausado e impedido como o mesmo estado visual", () => {
    expect(deriveStatus({ status: "PAUSED" }).state).toBe("paused")
    expect(deriveStatus({ status: "BLOCKED" }).state).toBe("paused")
  })

  it("traduz os não iniciados", () => {
    expect(deriveStatus({ status: "PLANNING" }).state).toBe("idle")
    expect(deriveStatus({ status: "PLANNED" }).state).toBe("idle")
    expect(deriveStatus({ status: "TODO" }).state).toBe("idle")
    expect(deriveStatus({ status: "CANCELLED" }).state).toBe("idle")
  })

  // Status novo no backend não pode derrubar a tela: cai no badge neutro.
  it("cai em idle para status desconhecido", () => {
    expect(deriveStatus({ status: "STATUS_QUE_NAO_EXISTE" }).state).toBe("idle")
  })

  it("monta a chave i18n a partir do status", () => {
    expect(deriveStatus({ status: "IN_PROGRESS" }).labelKey).toBe("status.IN_PROGRESS")
  })

  it("devolve daysLate 0 quando está no prazo", () => {
    expect(deriveStatus({ status: "IN_PROGRESS", plannedEndDate: "2026-03-25T00:00:00" })).toEqual({
      state: "progress",
      labelKey: "status.IN_PROGRESS",
      daysLate: 0,
    })
  })

  it("vira 'late' e informa os dias quando o prazo passou", () => {
    expect(deriveStatus({ status: "IN_PROGRESS", plannedEndDate: "2026-03-15T00:00:00" })).toEqual({
      state: "late",
      labelKey: "status.LATE",
      daysLate: 5,
    })
  })

  // O ponto central do módulo: obra entregue com prazo estourado é CONCLUÍDA,
  // não atrasada. Marcá-la de vermelho no histórico seria mentira.
  it("não marca atraso em status terminal, mesmo com prazo vencido", () => {
    for (const status of ["COMPLETED", "DONE", "CANCELLED"]) {
      expect(deriveStatus({ status, plannedEndDate: "2026-01-01T00:00:00" })).toMatchObject({
        daysLate: 0,
        labelKey: `status.${status}`,
      })
    }
  })

  it("marca atraso em status pausado com prazo vencido", () => {
    expect(deriveStatus({ status: "PAUSED", plannedEndDate: "2026-03-10T00:00:00" }).state).toBe(
      "late",
    )
  })
})
