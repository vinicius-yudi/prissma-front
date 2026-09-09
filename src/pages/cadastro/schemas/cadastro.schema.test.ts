import { describe, expect, it } from "vitest"

import { cadastroArquitetoSchema } from "./cadastroArquiteto.schema"
import { cadastroClienteSchema } from "./cadastroCliente.schema"
import { cadastroEngenheiroSchema } from "./cadastroEngenheiro.schemas"

/**
 * Os três cadastros (cliente, arquiteto, engenheiro) têm HOJE exatamente as
 * mesmas regras. O teste roda a bateria nos três em vez de escolher um: se um
 * deles ganhar uma regra própria — CREA para engenheiro, por exemplo — a
 * divergência aparece aqui, e não em produção, com um dos formulários
 * aceitando senha que o backend rejeita.
 */

const SCHEMAS = [
  ["cliente", cadastroClienteSchema],
  ["arquiteto", cadastroArquitetoSchema],
  ["engenheiro", cadastroEngenheiroSchema],
] as const

const valido = {
  name: "Ana Souza",
  email: "ana@construtora.com",
  password: "Obra@2026",
  confirmPassword: "Obra@2026",
}

describe.each(SCHEMAS)("cadastro de %s", (_perfil, schema) => {
  function erroDe(data: unknown, campo: string): string | undefined {
    const result = schema.safeParse(data)
    if (result.success) return undefined
    return result.error.flatten().fieldErrors[campo]?.[0]
  }

  it("aceita cadastro válido", () => {
    expect(schema.safeParse(valido).success).toBe(true)
  })

  it("exige nome com pelo menos 3 caracteres", () => {
    expect(erroDe({ ...valido, name: "Jo" }, "name")).toBe("O nome deve conter pelo menos 3 caracteres")
  })

  it("exige e-mail em formato válido", () => {
    expect(erroDe({ ...valido, email: "ana-construtora" }, "email")).toBe("Formato de e-mail inválido")
  })

  it("exige senha com pelo menos 6 caracteres", () => {
    expect(erroDe({ ...valido, password: "Ob@1", confirmPassword: "Ob@1" }, "password")).toBe(
      "A senha deve ter pelo menos 6 caracteres",
    )
  })

  // Cada regra de composição tem mensagem própria; testar uma por uma é o que
  // garante que o usuário saiba QUAL caractere falta, em vez de "senha fraca".
  it("cobra maiúscula, minúscula, número e símbolo separadamente", () => {
    const casos: [string, string][] = [
      ["obra@2026", "A senha deve conter pelo menos uma letra maiúscula"],
      ["OBRA@2026", "A senha deve conter pelo menos uma letra minúscula"],
      ["Obra@obra", "A senha deve conter pelo menos um número"],
      ["Obra2026", "A senha deve conter pelo menos um símbolo especial"],
    ]

    for (const [password, mensagem] of casos) {
      expect(erroDe({ ...valido, password, confirmPassword: password }, "password"), password).toBe(
        mensagem,
      )
    }
  })

  it("exige a confirmação", () => {
    expect(erroDe({ ...valido, confirmPassword: "" }, "confirmPassword")).toBe(
      "A confirmação de senha é obrigatória",
    )
  })

  // O erro precisa cair em `confirmPassword`, não na raiz: é lá que o campo
  // está na tela e onde o react-hook-form vai procurá-lo.
  it("acusa senhas diferentes no campo de confirmação", () => {
    expect(erroDe({ ...valido, confirmPassword: "Outra@2026" }, "confirmPassword")).toBe(
      "As senhas não coincidem",
    )
  })
})
