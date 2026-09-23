import { describe, expect, it } from "vitest"

import { allocationSchema, responsibilitySchema } from "../schedule.schema"

/**
 * Este schema existe para dizer em português o que o backend recusaria com um
 * 400 em inglês. Se ele afrouxar, o usuário passa a ver a mensagem crua do
 * servidor; se apertar demais, a tela recusa valor que o banco aceita.
 */

function erro(result: ReturnType<typeof allocationSchema.safeParse>): string | undefined {
  return result.success ? undefined : result.error.issues[0]?.message
}

describe("allocationSchema", () => {
  it("aceita as horas cheias do dia", () => {
    expect(allocationSchema.safeParse({ allocatedHours: 8 }).success).toBe(true)
    expect(allocationSchema.safeParse({ allocatedHours: 24 }).success).toBe(true)
  })

  // 0 não vai para o backend: o hook o traduz em DELETE. Mas precisa passar
  // pela validação, senão não há como liberar o dia pelo formulário.
  it("aceita zero, que é liberar o dia", () => {
    expect(allocationSchema.safeParse({ allocatedHours: 0 }).success).toBe(true)
  })

  it("recusa fora do intervalo do banco", () => {
    expect(erro(allocationSchema.safeParse({ allocatedHours: -1 }))).toBe(
      "obra.schedule.errors.hoursRange",
    )
    expect(erro(allocationSchema.safeParse({ allocatedHours: 25 }))).toBe(
      "obra.schedule.errors.hoursRange",
    )
  })

  it("recusa mais de duas casas decimais", () => {
    expect(erro(allocationSchema.safeParse({ allocatedHours: 0.005 }))).toBe(
      "obra.schedule.errors.hoursDecimals",
    )
  })

  // 0.07 * 100 dá 7.000000000000001 em ponto flutuante: uma checagem ingênua
  // de "duas casas" reprovaria um valor que o banco aceita.
  it("aceita duas casas que o ponto flutuante distorce", () => {
    expect(allocationSchema.safeParse({ allocatedHours: 0.07 }).success).toBe(true)
    expect(allocationSchema.safeParse({ allocatedHours: 7.25 }).success).toBe(true)
  })

  // O campo é registrado com `valueAsNumber`: input vazio chega como NaN.
  it("trata campo vazio como obrigatório, não como zero", () => {
    expect(erro(allocationSchema.safeParse({ allocatedHours: Number.NaN }))).toBe(
      "obra.schedule.errors.hoursRequired",
    )
  })
})

describe("responsibilitySchema", () => {
  it("apara o espaço em volta", () => {
    const result = responsibilitySchema.safeParse({ userResponsibility: "  Estrutura  " })

    expect(result.success && result.data.userResponsibility).toBe("Estrutura")
  })

  it("aceita vazio, que limpa a frente de trabalho", () => {
    expect(responsibilitySchema.safeParse({ userResponsibility: "" }).success).toBe(true)
  })

  it("recusa acima do limite da coluna", () => {
    const result = responsibilitySchema.safeParse({ userResponsibility: "x".repeat(101) })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      "obra.schedule.errors.responsibilityLength",
    )
  })
})
