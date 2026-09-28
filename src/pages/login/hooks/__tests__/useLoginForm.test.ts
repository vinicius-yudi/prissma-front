import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import { login } from "../../services/login.service"
import { useLoginForm } from "../useLoginForm"

const navigate = vi.fn()
const saveToken = vi.fn()
const logout = vi.fn()
const toastError = vi.fn()

vi.mock("../../services/login.service", () => ({ login: vi.fn() }))
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ saveToken, logout }) }))
vi.mock("react-toastify", () => ({ toast: { error: (msg: string) => toastError(msg) } }))
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}))

const loginMock = vi.mocked(login)

function setup() {
  return renderHook(() => useLoginForm(), { wrapper: createHookWrapper() })
}

/** Preenche o formulário disparando o mesmo handleChange que os inputs usam. */
function fill(result: { current: ReturnType<typeof useLoginForm> }, email: string, password: string) {
  act(() => {
    result.current.handleChange({
      target: { name: "email", value: email },
    } as React.ChangeEvent<HTMLInputElement>)
  })
  act(() => {
    result.current.handleChange({
      target: { name: "password", value: password },
    } as React.ChangeEvent<HTMLInputElement>)
  })
}

function submit(result: { current: ReturnType<typeof useLoginForm> }) {
  act(() => {
    result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>)
  })
}

describe("useLoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset()
    navigate.mockReset()
    saveToken.mockReset()
    logout.mockReset()
    toastError.mockReset()
  })

  it("começa com os campos vazios, senha oculta e sem envio em curso", () => {
    const { result } = setup()

    expect(result.current.formData).toEqual({ email: "", password: "" })
    expect(result.current.showPassword).toBe(false)
    expect(result.current.isPending).toBe(false)
  })

  it("atualiza só o campo alterado", () => {
    const { result } = setup()

    fill(result, "obra@prissma.com", "senha123")

    expect(result.current.formData).toEqual({ email: "obra@prissma.com", password: "senha123" })
  })

  it("alterna a visibilidade da senha", () => {
    const { result } = setup()

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(true)

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(false)
  })

  it("não chama a API quando o formulário é inválido", () => {
    const { result } = setup()

    fill(result, "nao-e-email", "123")
    submit(result)

    expect(loginMock).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledTimes(1)
  })

  // A sessão anterior precisa morrer ANTES do request: sem isto o login novo
  // herda o cache do usuário antigo enquanto o perfil não volta.
  it("encerra a sessão anterior antes de enviar", async () => {
    loginMock.mockResolvedValue({ token: "jwt" })
    const { result } = setup()

    fill(result, "obra@prissma.com", "senha123")
    submit(result)

    // `logout()` roda no próprio handler, mas `mutate()` só agenda a
    // mutationFn — daí a asserção síncrona no primeiro e o waitFor no segundo.
    expect(logout).toHaveBeenCalledTimes(1)
    // Só o 1º argumento: o TanStack Query v5 injeta um contexto como 2º, que
    // não é contrato nosso.
    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1))
    expect(loginMock.mock.calls[0]?.[0]).toEqual({
      email: "obra@prissma.com",
      password: "senha123",
    })
  })

  it("grava o token e navega para o dashboard no sucesso", async () => {
    loginMock.mockResolvedValue({ token: "jwt-valido" })
    const { result } = setup()

    fill(result, "obra@prissma.com", "senha123")
    submit(result)

    await waitFor(() => expect(saveToken).toHaveBeenCalledWith("jwt-valido"))
    expect(navigate).toHaveBeenCalledWith("/dashboard")
  })

  it("mostra mensagem específica quando o servidor recusa as credenciais", async () => {
    loginMock.mockRejectedValue(new Error("Invalid credentials"))
    const { result } = setup()

    fill(result, "obra@prissma.com", "senhaerrada")
    submit(result)

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("E-mail ou senha incorretos."))
    expect(navigate).not.toHaveBeenCalled()
  })

  it("cai na mensagem genérica para qualquer outro erro", async () => {
    loginMock.mockRejectedValue(new Error("503 Service Unavailable"))
    const { result } = setup()

    fill(result, "obra@prissma.com", "senha123")
    submit(result)

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Ocorreu um erro ao realizar o login."))
  })
})
