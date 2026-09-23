import { act, renderHook, waitFor } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "@/contexts/AuthContext"
import { createHookWrapper } from "@/test/renderWithProviders"

import { cadastroArquiteto } from "../../services/cadastroArquiteto.service"
import { cadastroCliente } from "../../services/cadastroCliente.service"
import { cadastroEngenheiro } from "../../services/cadastroEngenheiro.service"
import { useCadastroArquiteto } from "../useCadastroArquiteto"
import { useCadastroCliente } from "../useCadastroCliente"
import { useCadastroEngenheiro } from "../useCadastroEngenheiro"
import { useCadastroForm } from "../useCadastroForm"

/**
 * Os três cadastros compartilham o mesmo desenho: estado controlado, validação
 * pelo schema ANTES de chamar a rede, e login automático no sucesso. A tabela
 * roda a bateria nos três — se um deles deixar de validar ou de guardar o
 * token, a conta é criada e o usuário fica na tela de cadastro sem entender.
 */

const navigate = vi.fn()
const saveToken = vi.fn()

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}))

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("../../services/cadastroCliente.service", () => ({ cadastroCliente: vi.fn() }))
vi.mock("../../services/cadastroArquiteto.service", () => ({ cadastroArquiteto: vi.fn() }))
vi.mock("../../services/cadastroEngenheiro.service", () => ({ cadastroEngenheiro: vi.fn() }))

const { toast } = await import("react-toastify")

const CASOS = [
  ["cliente", useCadastroCliente, vi.mocked(cadastroCliente), "formDataCliente"],
  ["arquiteto", useCadastroArquiteto, vi.mocked(cadastroArquiteto), "formDataArquiteto"],
  ["engenheiro", useCadastroEngenheiro, vi.mocked(cadastroEngenheiro), "formDataEngenheiro"],
] as const

const VALIDO = {
  name: "Ana Souza",
  email: "ana@construtora.com",
  password: "Obra@2026",
  confirmPassword: "Obra@2026",
}

function changeEvent(name: string, value: string) {
  return { target: { name, value } } as ChangeEvent<HTMLInputElement>
}

function submitEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({ saveToken } as unknown as ReturnType<typeof useAuth>)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe.each(CASOS)("cadastro de %s", (_perfil, useCadastro, cadastrar, campoDoForm) => {
  type Resultado = ReturnType<typeof useCadastro> & Record<string, typeof VALIDO>

  function render() {
    return renderHook(() => useCadastro() as Resultado, { wrapper: createHookWrapper() })
  }

  function preencher(result: { current: Resultado }, dados = VALIDO) {
    for (const [campo, valor] of Object.entries(dados)) {
      act(() => result.current.handleChange(changeEvent(campo, valor)))
    }
  }

  it("começa com o formulário em branco e a senha oculta", () => {
    const { result } = render()

    expect(result.current[campoDoForm]).toEqual({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    expect(result.current.showPassword).toBe(false)
  })

  it("atualiza o campo pelo `name` do input", () => {
    const { result } = render()

    act(() => result.current.handleChange(changeEvent("email", "ana@construtora.com")))

    expect(result.current[campoDoForm].email).toBe("ana@construtora.com")
    expect(result.current[campoDoForm].name).toBe("")
  })

  it("alterna a visibilidade da senha", () => {
    const { result } = render()

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(true)

    act(() => result.current.togglePassword())
    expect(result.current.showPassword).toBe(false)
  })

  // Validar antes de chamar a rede é o que transforma "erro 400" em uma
  // mensagem que diz qual campo está errado.
  it("não chama a API quando o formulário é inválido", async () => {
    const { result } = render()
    preencher(result, { ...VALIDO, email: "ana-construtora" })

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(cadastrar).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Formato de e-mail inválido")
  })

  it("avisa quando as senhas não coincidem", async () => {
    const { result } = render()
    preencher(result, { ...VALIDO, confirmPassword: "Outra@2026" })

    await act(async () => result.current.handleSubmit(submitEvent()))

    expect(cadastrar).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("As senhas não coincidem")
  })

  it("segura o recarregamento da página no submit", async () => {
    const { result } = render()
    const evento = submitEvent()

    await act(async () => result.current.handleSubmit(evento))

    expect(evento.preventDefault).toHaveBeenCalled()
  })

  it("envia o formulário quando tudo é válido", async () => {
    cadastrar.mockResolvedValue({ token: "jwt-novo" })
    const { result } = render()
    preencher(result)

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(cadastrar.mock.calls[0][0]).toEqual(VALIDO))
  })

  // Cadastrar já loga: guardar o token e ir para o dashboard evita mandar o
  // usuário digitar de novo as credenciais que ele acabou de escolher.
  it("guarda o token e vai para o dashboard no sucesso", async () => {
    cadastrar.mockResolvedValue({ token: "jwt-novo" })
    const { result } = render()
    preencher(result)

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(saveToken).toHaveBeenCalledWith("jwt-novo"))
    expect(navigate).toHaveBeenCalledWith("/dashboard")
  })

  // E-mail repetido é o erro mais comum aqui e merece texto próprio; o resto
  // cai na mensagem genérica em vez de vazar o erro cru do backend.
  it("dá mensagem específica para e-mail já cadastrado", async () => {
    cadastrar.mockRejectedValue(new Error("Email já cadastrado no sistema"))
    const { result } = render()
    preencher(result)

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Este e-mail já está sendo utilizado."),
    )
    expect(navigate).not.toHaveBeenCalled()
  })

  it("cai na mensagem genérica para os demais erros", async () => {
    cadastrar.mockRejectedValue(new Error("Erro 500"))
    const { result } = render()
    preencher(result)

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao cadastrar usuário."))
  })
})

/**
 * `useCadastroForm` é o hook antigo do formulário de arquiteto: sem validação
 * e sem login automático, ele apenas expõe o erro da mutation. Continua no
 * código, então continua coberto — mas o teste deixa a diferença registrada.
 */
describe("useCadastroForm (formulário legado)", () => {
  it("envia sem validar e expõe o erro da mutation", async () => {
    const cadastrar = vi.mocked(cadastroArquiteto)
    cadastrar.mockRejectedValue(new Error("Erro 400"))
    const { result } = renderHook(() => useCadastroForm(), { wrapper: createHookWrapper() })

    await act(async () => result.current.handleSubmit(submitEvent()))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.errorMessage).toBe("Erro 400")
    // Formulário vazio e ainda assim chamou a API — é o que o distingue dos
    // três hooks acima.
    expect(cadastrar).toHaveBeenCalled()
  })

  it("mantém o próprio estado de campos e de senha", () => {
    const { result } = renderHook(() => useCadastroForm(), { wrapper: createHookWrapper() })

    act(() => result.current.handleChange(changeEvent("name", "Ana")))
    act(() => result.current.togglePassword())

    expect(result.current.formDataArquiteto.name).toBe("Ana")
    expect(result.current.showPassword).toBe(true)
  })
})
