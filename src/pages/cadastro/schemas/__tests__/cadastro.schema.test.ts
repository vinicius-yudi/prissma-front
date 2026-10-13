import { describe, expect, it } from "vitest"

import { fieldError } from "@/test/zod"

import { cadastroSchema } from "../cadastro.schema"

/**
 * Um schema para os três perfis. As mensagens são chaves i18n — a view as
 * traduz —, então o teste confere a chave, não o texto.
 */
const valido = {
  name: "Ana Souza",
  email: "ana@construtora.com",
  password: "Obra@2026",
  confirmPassword: "Obra@2026",
}

describe("cadastroSchema", () => {
  it("aceita cadastro válido", () => {
    expect(cadastroSchema.safeParse(valido).success).toBe(true)
  })

  it("exige nome com pelo menos 3 caracteres, sem contar espaços", () => {
    expect(fieldError(cadastroSchema, { ...valido, name: "  Jo " }, "name")).toBe("validation.nameMin")
  })

  it("exige e-mail em formato válido", () => {
    expect(fieldError(cadastroSchema, { ...valido, email: "" }, "email")).toBe("validation.emailRequired")
    expect(fieldError(cadastroSchema, { ...valido, email: "ana-construtora" }, "email")).toBe(
      "validation.emailInvalid",
    )
  })

  // As regras são as mesmas que a lista marca na tela e que o backend exige.
  it.each(["Ob@1", "obra@2026", "OBRA@2026", "Obra@obra", "Obra2026"])(
    "recusa a senha %s, que falha numa regra",
    (password) => {
      expect(fieldError(cadastroSchema, { ...valido, password, confirmPassword: password }, "password")).toBe(
        "validation.passwordRules",
      )
    },
  )

  it("exige a confirmação", () => {
    expect(fieldError(cadastroSchema, { ...valido, confirmPassword: "" }, "confirmPassword")).toBe(
      "validation.confirmRequired",
    )
  })

  // O erro precisa cair em `confirmPassword`: é lá que o campo está na tela.
  it("acusa senhas diferentes no campo de confirmação", () => {
    expect(fieldError(cadastroSchema, { ...valido, confirmPassword: "Outra@2026" }, "confirmPassword")).toBe(
      "validation.passwordMismatch",
    )
  })
})
