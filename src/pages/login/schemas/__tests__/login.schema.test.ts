import { describe, expect, it } from "vitest"

import { fieldError } from "@/test/zod"

import { loginSchema } from "../login.schema"

const valido = { email: "obra@prissma.com", password: "senha123" }

describe("loginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    expect(loginSchema.safeParse(valido).success).toBe(true)
  })

  it.each([
    ["exige e-mail", { ...valido, email: "" }, "email", "validation.emailRequired"],
    ["rejeita e-mail sem formato válido", { ...valido, email: "obra-prissma" }, "email", "validation.emailInvalid"],
    ["exige senha", { ...valido, password: "" }, "password", "validation.passwordRequired"],
    // O mínimo de 6 é a regra do back-end: se só um lado mudar, o usuário leva
    // erro de servidor num campo que passou no cliente.
    ["rejeita senha curta", { ...valido, password: "12345" }, "password", "validation.passwordMin"],
  ])("%s", (_caso, dados, campo, chave) => {
    expect(fieldError(loginSchema, dados, campo)).toBe(chave)
  })

  it("aceita senha com exatamente 6 caracteres", () => {
    expect(loginSchema.safeParse({ ...valido, password: "123456" }).success).toBe(true)
  })
})
