import type { FieldErrors } from "react-hook-form"
import { describe, expect, it } from "vitest"

import { getFirstFormErrorMessage } from "./formValidation"

/**
 * O toast de erro do formulário mostra UMA mensagem. Esta função escolhe qual —
 * então o que importa é a ordem (a primeira do objeto) e a descida em campos
 * aninhados, que é onde moram os endereços do cadastro de obra.
 */
describe("getFirstFormErrorMessage", () => {
  it("devolve undefined quando não há erro", () => {
    expect(getFirstFormErrorMessage({})).toBeUndefined()
  })

  it("devolve a mensagem do único campo com erro", () => {
    const errors = { email: { message: "O e-mail é obrigatório." } } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBe("O e-mail é obrigatório.")
  })

  it("devolve a primeira mensagem quando há vários campos com erro", () => {
    const errors = {
      email: { message: "O e-mail é obrigatório." },
      password: { message: "A senha é obrigatória." },
    } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBe("O e-mail é obrigatório.")
  })

  it("desce em erro aninhado", () => {
    const errors = {
      address: { zipCode: { message: "CEP inválido." } },
    } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBe("CEP inválido.")
  })

  // Um campo pode existir no objeto de erros sem mensagem (só `type`); pular
  // esse e continuar procurando é o que evita um toast vazio.
  it("ignora entrada sem mensagem e segue para a próxima", () => {
    const errors = {
      name: { type: "required" },
      email: { message: "O e-mail é obrigatório." },
    } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBe("O e-mail é obrigatório.")
  })

  it("ignora entrada nula", () => {
    const errors = {
      name: undefined,
      email: { message: "O e-mail é obrigatório." },
    } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBe("O e-mail é obrigatório.")
  })

  it("devolve undefined quando nenhum erro tem mensagem", () => {
    const errors = { name: { type: "required" } } as unknown as FieldErrors

    expect(getFirstFormErrorMessage(errors)).toBeUndefined()
  })
})
