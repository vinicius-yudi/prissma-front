import { act, renderHook, waitFor } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole, type UserProfile } from "@/shared/types/user"
import { createHookWrapper } from "@/test/renderWithProviders"

import { updateProfile } from "../../services/perfil.service"
import { usePerfilForm } from "../usePerfilForm"

vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/perfil.service", () => ({
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const buscarPerfil = vi.mocked(getMyProfile)
const salvar = vi.mocked(updateProfile)

const PERFIL: UserProfile = {
  id: 42,
  name: "Ana Souza",
  email: "ana@alfa.com",
  role: GlobalRole.ENG,
}

/** `handleChange` lê só `name` e `value`; o resto do evento é ruído aqui. */
function change(name: string, value: string) {
  return { target: { name, value } } as ChangeEvent<HTMLInputElement>
}

function submit() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}

const onClose = vi.fn()

function render(open = true) {
  return renderHook(() => usePerfilForm({ open, onClose }), { wrapper: createHookWrapper() })
}

/** Monta com o modal aberto e espera o perfil chegar preenchido. */
async function renderCarregado() {
  const view = render()
  await waitFor(() => expect(view.result.current.form.name).toBe(PERFIL.name))
  return view
}

beforeEach(() => {
  vi.resetAllMocks()
  buscarPerfil.mockResolvedValue(PERFIL)
  salvar.mockResolvedValue(PERFIL)
})

describe("usePerfilForm — carga inicial", () => {
  it("abre vazio antes do perfil chegar", () => {
    const { result } = render()

    expect(result.current.form).toEqual({
      name: "",
      email: "",
      role: GlobalRole.USER,
      newPassword: "",
      confirmPassword: "",
    })
  })

  it("preenche o formulário com o perfil do usuário", async () => {
    const { result } = await renderCarregado()

    expect(result.current.form.email).toBe(PERFIL.email)
    expect(result.current.form.role).toBe(GlobalRole.ENG)
    // Senha nunca vem do servidor: os campos ficam em branco.
    expect(result.current.form.newPassword).toBe("")
  })

  // O modal reabre com o que sobrou do fechamento anterior se ninguém limpar:
  // uma senha digitada e não salva reapareceria no próximo uso.
  it("limpa o que foi digitado ao reabrir", async () => {
    const { result, rerender } = renderHook(({ open }) => usePerfilForm({ open, onClose }), {
      wrapper: createHookWrapper(),
      initialProps: { open: true },
    })
    await waitFor(() => expect(result.current.form.name).toBe(PERFIL.name))
    act(() => result.current.handleChange(change("newPassword", "Segredo@1")))

    rerender({ open: false })
    rerender({ open: true })

    expect(result.current.form.newPassword).toBe("")
    expect(result.current.showPassword).toBe(false)
  })
})

describe("usePerfilForm — edição dos campos", () => {
  it("escreve o campo alterado sem tocar nos outros", async () => {
    const { result } = await renderCarregado()

    act(() => result.current.handleChange(change("name", "Ana Lima")))

    expect(result.current.form.name).toBe("Ana Lima")
    expect(result.current.form.email).toBe(PERFIL.email)
  })

  it("troca o papel pelo select", async () => {
    const { result } = await renderCarregado()

    act(() =>
      result.current.handleRoleChange({
        target: { value: GlobalRole.ARQ },
      } as ChangeEvent<HTMLSelectElement>),
    )

    expect(result.current.form.role).toBe(GlobalRole.ARQ)
  })

  it("alterna a visibilidade das duas senhas de forma independente", async () => {
    const { result } = await renderCarregado()

    act(() => result.current.togglePassword())

    expect(result.current.showPassword).toBe(true)
    expect(result.current.showConfirm).toBe(false)

    act(() => result.current.toggleConfirm())

    expect(result.current.showConfirm).toBe(true)
  })
})

/**
 * A regra de senha forte é do backend, mas repetida aqui para o usuário não
 * descobrir por 400 qual caractere faltou. Cada mensagem aponta o que corrigir,
 * então cada uma tem seu caso.
 */
describe("usePerfilForm — validação da nova senha", () => {
  async function tentarComSenha(senha: string, confirmacao = senha) {
    const { result } = await renderCarregado()
    act(() => result.current.handleChange(change("newPassword", senha)))
    act(() => result.current.handleChange(change("confirmPassword", confirmacao)))
    act(() => result.current.handleSubmit(submit()))
    return result
  }

  it.each([
    ["sem maiúscula", "segredo@1", "maiúscula"],
    ["sem minúscula", "SEGREDO@1", "minúscula"],
    ["sem número", "Segredo@x", "número"],
    ["sem caractere especial", "Segredo11", "especial"],
  ])("recusa senha %s", async (_caso, senha, trecho) => {
    await tentarComSenha(senha)

    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining(trecho))
    expect(salvar).not.toHaveBeenCalled()
  })

  it("recusa quando a confirmação não bate", async () => {
    await tentarComSenha("Segredo@1", "Segredo@2")

    expect(toast.warning).toHaveBeenCalledWith("As senhas não coincidem.")
    expect(salvar).not.toHaveBeenCalled()
  })

  it("envia a senha válida junto do restante", async () => {
    await tentarComSenha("Segredo@1")

    await waitFor(() => expect(salvar).toHaveBeenCalledWith(42, { password: "Segredo@1" }))
  })
})

describe("usePerfilForm — envio", () => {
  it("não envia enquanto o perfil não carregou", () => {
    const { result } = render()

    act(() => result.current.handleSubmit(submit()))

    expect(salvar).not.toHaveBeenCalled()
  })

  // Um PATCH com o corpo vazio gastaria uma ida ao servidor para não mudar
  // nada; o aviso deixa claro que o clique foi registrado.
  it("avisa e não chama a API quando nada mudou", async () => {
    const { result } = await renderCarregado()

    act(() => result.current.handleSubmit(submit()))

    expect(toast.info).toHaveBeenCalledWith("Nenhuma alteração detectada.")
    expect(salvar).not.toHaveBeenCalled()
  })

  it("manda só os campos que mudaram", async () => {
    const { result } = await renderCarregado()
    act(() => result.current.handleChange(change("name", "Ana Lima")))

    act(() => result.current.handleSubmit(submit()))

    await waitFor(() => expect(salvar).toHaveBeenCalledWith(42, { name: "Ana Lima" }))
  })

  it("manda e-mail e papel quando os dois mudam", async () => {
    const { result } = await renderCarregado()
    act(() => result.current.handleChange(change("email", "ana.lima@alfa.com")))
    act(() =>
      result.current.handleRoleChange({
        target: { value: GlobalRole.ARQ },
      } as ChangeEvent<HTMLSelectElement>),
    )

    act(() => result.current.handleSubmit(submit()))

    await waitFor(() =>
      expect(salvar).toHaveBeenCalledWith(42, {
        email: "ana.lima@alfa.com",
        role: GlobalRole.ARQ,
      }),
    )
  })

  it("avisa e fecha o modal quando salva", async () => {
    const { result } = await renderCarregado()
    act(() => result.current.handleChange(change("name", "Ana Lima")))

    act(() => result.current.handleSubmit(submit()))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(toast.success).toHaveBeenCalledWith("Perfil atualizado com sucesso!")
  })

  it("mostra a mensagem do backend e mantém o modal aberto no erro", async () => {
    salvar.mockRejectedValue(new Error("E-mail já cadastrado."))
    const { result } = await renderCarregado()
    act(() => result.current.handleChange(change("email", "ocupado@alfa.com")))

    act(() => result.current.handleSubmit(submit()))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("E-mail já cadastrado."))
    expect(onClose).not.toHaveBeenCalled()
  })
})
