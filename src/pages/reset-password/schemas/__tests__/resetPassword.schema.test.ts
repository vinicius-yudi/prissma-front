import { describe, expect, it } from "vitest"

import { fieldError } from "@/test/zod"

import { resetPasswordSchema } from "../resetPassword.schema"

describe("resetPasswordSchema", () => {
  it("aceita senha forte confirmada", () => {
    expect(resetPasswordSchema.safeParse({ newPassword: "Obra@2026", confirmPassword: "Obra@2026" }).success).toBe(
      true,
    )
  })

  it("recusa senha que não cumpre as regras", () => {
    expect(fieldError(resetPasswordSchema, { newPassword: "obra", confirmPassword: "obra" }, "newPassword")).toBe(
      "validation.passwordRules",
    )
  })

  it("acusa confirmação vazia e diferente no campo de confirmação", () => {
    expect(fieldError(resetPasswordSchema, { newPassword: "Obra@2026", confirmPassword: "" }, "confirmPassword")).toBe(
      "validation.confirmRequired",
    )
    expect(
      fieldError(resetPasswordSchema, { newPassword: "Obra@2026", confirmPassword: "Obra@2027" }, "confirmPassword"),
    ).toBe("validation.passwordMismatch")
  })
})
