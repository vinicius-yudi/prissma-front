import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { useLoginForm } from "../hooks/useLoginForm"
import { LoginForm } from "./LoginForm"

// O hook é a fronteira da unidade: aqui se testa o que o componente DESENHA e
// o que ele DELEGA, não a regra de login (que tem o teste dela em
// useLoginForm.test.ts).
vi.mock("../hooks/useLoginForm", () => ({ useLoginForm: vi.fn() }))

const useLoginFormMock = vi.mocked(useLoginForm)

const handleChange = vi.fn()
const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
const togglePassword = vi.fn()

function mockHook(overrides: Partial<ReturnType<typeof useLoginForm>> = {}) {
  useLoginFormMock.mockReturnValue({
    formData: { email: "", password: "" },
    showPassword: false,
    isPending: false,
    handleChange,
    handleSubmit,
    togglePassword,
    ...overrides,
  })
}

describe("<LoginForm />", () => {
  beforeEach(() => {
    handleChange.mockReset()
    handleSubmit.mockReset()
    togglePassword.mockReset()
    mockHook()
  })

  it("renderiza título, subtítulo e os dois campos", () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByRole("heading", { name: "Bem-vindo de volta!" })).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    expect(screen.getByLabelText("Senha")).toBeInTheDocument()
  })

  // autoComplete errado quebra o preenchimento do gerenciador de senhas, e é o
  // tipo de atributo que some num refactor sem ninguém notar.
  it("marca os campos com o autocomplete correto", () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText("E-mail")).toHaveAttribute("autocomplete", "email")
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "current-password")
  })

  it("delega a digitação ao hook", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText("E-mail"), "a")

    expect(handleChange).toHaveBeenCalled()
  })

  it("esconde a senha por padrão e oferece o botão de mostrar", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }))

    expect(togglePassword).toHaveBeenCalledTimes(1)
  })

  it("revela a senha e troca o rótulo do botão quando showPassword está ligado", () => {
    mockHook({ showPassword: true })
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument()
  })

  it("envia o formulário pelo handler do hook", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole("button", { name: /Entrar/ }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it("desabilita o botão e troca o texto durante o envio", () => {
    mockHook({ isPending: true })
    renderWithProviders(<LoginForm />)

    const submit = screen.getByRole("button", { name: "Entrando..." })
    expect(submit).toBeDisabled()
  })

  it("aponta os links para recuperação de senha e cadastro", () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
      "href",
      "/forgot-password",
    )
    expect(screen.getByRole("link", { name: "Cadastrar" })).toHaveAttribute("href", "/cadastro")
  })
})
