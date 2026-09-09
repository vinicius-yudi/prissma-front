import { describe, expect, it } from "vitest"

import { loginSchema } from "./login.schema"

/** Helper: extrai a primeira mensagem de erro de um campo. */
function firstError(data: unknown, field: "email" | "password"): string | undefined {
  const result = loginSchema.safeParse(data)
  if (result.success) return undefined
  return result.error.flatten().fieldErrors[field]?.[0]
}

describe("loginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = loginSchema.safeParse({ email: "obra@prissma.com", password: "senha123" })

    expect(result.success).toBe(true)
  })

  it("exige e-mail", () => {
    expect(firstError({ email: "", password: "senha123" }, "email")).toBe("O e-mail é obrigatório.")
  })

  it("rejeita e-mail sem formato válido", () => {
    expect(firstError({ email: "obra-prissma", password: "senha123" }, "email")).toBe(
      "Informe um e-mail válido.",
    )
  })

  it("exige senha", () => {
    expect(firstError({ email: "obra@prissma.com", password: "" }, "password")).toBe(
      "A senha é obrigatória.",
    )
  })

  // O mínimo de 6 é a regra que o back-end também aplica; se um dos dois mudar
  // sozinho o usuário leva erro de servidor num campo que passou no cliente.
  it("rejeita senha com menos de 6 caracteres", () => {
    expect(firstError({ email: "obra@prissma.com", password: "12345" }, "password")).toBe(
      "A senha deve ter no mínimo 6 caracteres.",
    )
  })

  it("aceita senha com exatamente 6 caracteres", () => {
    const result = loginSchema.safeParse({ email: "obra@prissma.com", password: "123456" })

    expect(result.success).toBe(true)
  })

  it("acusa os dois campos quando ambos estão vazios", () => {
    const result = loginSchema.safeParse({ email: "", password: "" })

    expect(result.success).toBe(false)
    if (result.success) return
    const errors = result.error.flatten().fieldErrors
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
  })
})
