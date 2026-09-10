import { act, renderHook, waitFor } from "@testing-library/react"
import type { FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { forgotPassword } from "@/pages/forgot-password/services/forgot-password.service"
import { useForgotPasswordForm } from "@/pages/forgot-password/hooks/useForgotPasswordForm"
import { createHookWrapper } from "@/test/renderWithProviders"

import { resetPassword } from "../../services/reset-password.service"
import { useResetPasswordForm } from "../useResetPasswordForm"

/**
 * Os dois formulários da recuperação de senha validam ANTES de chamar a rede,
 * e cada regra tem um aviso próprio. O que se testa aqui é justamente isso:
 * que a request não sai quando a entrada é inválida — mandar e deixar o
 * backend recusar transformaria erro de digitação em toast genérico.
 */

const navigate = vi.fn()
let params = new URLSearchParams()

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
  useSearchParams: () => [params, vi.fn()],
}))

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock("../../services/reset-password.service", () => ({ resetPassword: vi.fn() }))
vi.mock("@/pages/forgot-password/services/forgot-password.service", () => ({
  forgotPassword: vi.fn(),
}))

const { toast } = await import("react-toastify")
const redefinir = vi.mocked(resetPassword)
const pedirRecuperacao = vi.mocked(forgotPassword)

/** Evento de submit com `preventDefault` observável. */
function submitEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}

function renderReset(token = "tok-123") {
  params = new URLSearchParams(token ? { token } : {})
  return renderHook(() => useResetPasswordForm(), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  redefinir.mockResolvedValue(undefined)
  pedirRecuperacao.mockResolvedValue(undefined)
})

describe("useResetPasswordForm — token", () => {
  // Sem token a tela não tem o que fazer: ficar mostrando o formulário levaria
  // o usuário a digitar uma senha nova que nunca seria aceita.
  it("manda de volta para 'esqueci a senha' quando não há token na URL", () => {
    renderReset("")

    expect(navigate).toHaveBeenCalledWith("/forgot-password", { replace: true })
  })

  it("não redireciona quando o token está presente", () => {
    renderReset()

    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("useResetPasswordForm — validação", () => {
  async function submeter(senha: string, confirmacao = senha) {
    const { result } = renderReset()
    act(() => result.current.setNewPassword(senha))
    act(() => result.current.setConfirmPassword(confirmacao))
    await act(async () => result.current.handleSubmit(submitEvent()))
    return result
  }

  it("cobra cada regra de composição com o aviso próprio", async () => {
    const casos: [string, string][] = [
      ["obra@2026", "A senha deve conter pelo menos uma letra maiúscula."],
      ["OBRA@2026", "A senha deve conter pelo menos uma letra minúscula."],
      ["Obra@obra", "A senha deve conter pelo menos um número."],
      ["Obra2026", "A senha deve conter pelo menos um caractere especial."],
    ]

    for (const [senha, aviso] of casos) {
      vi.mocked(toast.warning).mockClear()
      redefinir.mockClear()

      await submeter(senha)

      expect(toast.warning, senha).toHaveBeenCalledWith(aviso)
      expect(redefinir, senha).not.toHaveBeenCalled()
    }
  })

  it("cobra que as senhas coincidam", async () => {
    await submeter("Obra@2026", "Outra@2026")

    expect(toast.warning).toHaveBeenCalledWith("As senhas não coincidem.")
    expect(redefinir).not.toHaveBeenCalled()
  })

  it("impede o envio sem token", async () => {
    const { result } = renderReset("")
    act(() => result.current.setNewPassword("Obra@2026"))
    act(() => result.current.setConfirmPassword("Obra@2026"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(toast.error).toHaveBeenCalledWith("Token inválido ou ausente.")
    expect(redefinir).not.toHaveBeenCalled()
  })

  it("segura o recarregamento da página no submit", async () => {
    const { result } = renderReset()
    const evento = submitEvent()

    await act(async () => result.current.handleSubmit(evento))

    expect(evento.preventDefault).toHaveBeenCalled()
  })
})

describe("useResetPasswordForm — envio", () => {
  it("manda token e senha nova quando tudo é válido", async () => {
    const { result } = renderReset()
    act(() => result.current.setNewPassword("Obra@2026"))
    act(() => result.current.setConfirmPassword("Obra@2026"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(redefinir).toHaveBeenCalledWith("tok-123", "Obra@2026"))
  })

  it("avisa e leva para o login no sucesso", async () => {
    const { result } = renderReset()
    act(() => result.current.setNewPassword("Obra@2026"))
    act(() => result.current.setConfirmPassword("Obra@2026"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"))
    expect(toast.success).toHaveBeenCalledWith("Senha redefinida com sucesso!")
  })

  // Token expirado é o erro comum aqui, e a mensagem do backend explica o quê.
  it("mostra a mensagem do backend no erro", async () => {
    redefinir.mockRejectedValue(new Error("Token expirado."))
    const { result } = renderReset()
    act(() => result.current.setNewPassword("Obra@2026"))
    act(() => result.current.setConfirmPassword("Obra@2026"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Token expirado."))
    expect(navigate).not.toHaveBeenCalledWith("/login")
  })
})

describe("useResetPasswordForm — visibilidade das senhas", () => {
  it("alterna os dois olhinhos de forma independente", () => {
    const { result } = renderReset()

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(true)
    expect(result.current.showConfirm).toBe(false)

    act(() => result.current.toggleConfirm())
    expect(result.current.showConfirm).toBe(true)

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(false)
  })
})

describe("useForgotPasswordForm", () => {
  function render() {
    return renderHook(() => useForgotPasswordForm(), { wrapper: createHookWrapper() })
  }

  it("cobra e-mail preenchido", async () => {
    const { result } = render()

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(toast.warning).toHaveBeenCalledWith("O e-mail é obrigatório.")
    expect(pedirRecuperacao).not.toHaveBeenCalled()
  })

  it("trata e-mail só com espaços como vazio", async () => {
    const { result } = render()
    act(() => result.current.setEmail("   "))

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(toast.warning).toHaveBeenCalledWith("O e-mail é obrigatório.")
  })

  it("cobra formato de e-mail", async () => {
    const { result } = render()
    act(() => result.current.setEmail("ana-construtora"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(toast.warning).toHaveBeenCalledWith("Informe um e-mail válido.")
    expect(pedirRecuperacao).not.toHaveBeenCalled()
  })

  // A tela troca o formulário por "verifique seu e-mail"; sem esse estado o
  // usuário reenviaria o pedido achando que nada aconteceu.
  it("marca como enviado no sucesso", async () => {
    const { result } = render()
    act(() => result.current.setEmail("ana@construtora.com"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(result.current.submitted).toBe(true))
    expect(pedirRecuperacao.mock.calls[0][0]).toBe("ana@construtora.com")
  })

  it("não marca como enviado quando o backend recusa", async () => {
    pedirRecuperacao.mockRejectedValue(new Error("Serviço indisponível."))
    const { result } = render()
    act(() => result.current.setEmail("ana@construtora.com"))

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Serviço indisponível."))
    expect(result.current.submitted).toBe(false)
  })
})
