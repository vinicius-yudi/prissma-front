import { describe, expect, it } from "vitest"

import { reportPeriodSchema } from "../reportPeriod.schema"

describe("reportPeriodSchema", () => {
  it("aceita o período vazio — o backend assume início da obra até hoje", () => {
    expect(reportPeriodSchema.safeParse({ from: "", to: "" }).success).toBe(true)
  })

  it("aceita só uma das pontas", () => {
    expect(reportPeriodSchema.safeParse({ from: "2026-06-01", to: "" }).success).toBe(true)
    expect(reportPeriodSchema.safeParse({ from: "", to: "2026-06-30" }).success).toBe(true)
  })

  it("aceita início igual ao fim", () => {
    expect(reportPeriodSchema.safeParse({ from: "2026-06-01", to: "2026-06-01" }).success).toBe(true)
  })

  it("recusa fim antes do início, com o erro no campo final", () => {
    const result = reportPeriodSchema.safeParse({ from: "2026-06-30", to: "2026-06-01" })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(["to"])
    expect(result.error?.issues[0].message).toBe("relatorios.report.validation.rangeInvalid")
  })

  it("recusa data fora do formato ISO", () => {
    expect(reportPeriodSchema.safeParse({ from: "30/06/2026", to: "" }).success).toBe(false)
  })
})
