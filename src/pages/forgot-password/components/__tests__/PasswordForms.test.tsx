import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResetPasswordForm } from "@/pages/reset-password/components/ResetPasswordForm"
import { renderWithProviders } from "@/test/renderWithProviders"

import { forgotPassword } from "../../services/forgot-password.service"
import { ForgotPasswordForm } from "../ForgotPasswordForm"

vi.mock("../../services/forgot-password.service", () => ({ forgotPassword: vi.fn() }))
vi.mock("@/pages/reset-password/hooks/useResetPasswordForm", () => ({
  useResetPasswordForm: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const { useResetPasswordForm } = await import(
  "@/pages/reset-password/hooks/useResetPasswordForm"
)
const enviar = vi.mocked(forgotPassword)
const resetForm = vi.mocked(useResetPasswordForm)

const setNewPassword = vi.fn()
const setConfirmPassword = vi.fn()
const togglePassword = vi.fn()
const toggleConfirm = vi.fn()
const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())

function mockResetForm(over: Partial<ReturnType<typeof useResetPasswordForm>> = {}) {
  resetForm.mockReturnValue({
    newPassword: "",
    setNewPassword,
    confirmPassword: "",
    setConfirmPassword,
    showPassword: false,
    togglePassword,
    showConfirm: false,
    toggleConfirm,
    handleSubmit,
    isPending: false,
    ...over,
  } as ReturnType<typeof useResetPasswordForm>)
}

beforeEach(() => {
  vi.resetAllMocks()
  enviar.mockResolvedValue(undefined as never)
  mockResetForm()
})

/**
 * A regra do formulário vive em `useForgotPasswordForm`; aqui se testa o que a
 * tela DESENHA e o que ela DELEGA — inclusive a troca para a confirmação de
 * envio, que é estado da tela.
 */
describe("<ForgotPasswordForm />", () => {
  function campoEmail() {
    return screen.getByRole("textbox")
  }

  function enviarBotao() {
    return screen.getByRole("button", { name: /Enviar link/ })
  }

  it("mostra o campo de e-mail e o atalho de volta ao login", () => {
    renderWithProviders(<ForgotPasswordForm />)

    expect(campoEmail()).toHaveAttribute("type", "email")
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/login")
  })

  /**
   * O campo é `required` e `type="email"`, então o navegador barra o submit
   * antes de o handler rodar. As duas checagens do hook ficam como rede de
   * segurança — daí o submit disparado direto no <form>, que é o único jeito
   * de chegar nelas.
   */
  it("nem chega a submeter com o e-mail em branco", async () => {
    renderWithProviders(<ForgotPasswordForm />)

    await userEvent.click(enviarBotao())

    expect(enviar).not.toHaveBeenCalled()
  })

  it("recusa e-mail em branco que escape da validação nativa", () => {
    const { container } = renderWithProviders(<ForgotPasswordForm />)

    fireEvent.submit(container.querySelector("form") as HTMLFormElement)

    expect(toast.warning).toHaveBeenCalledWith("O e-mail é obrigatório.")
    expect(enviar).not.toHaveBeenCalled()
  })

  it("recusa e-mail malformado que escape da validação nativa", async () => {
    const { container } = renderWithProviders(<ForgotPasswordForm />)

    await userEvent.type(campoEmail(), "ana.alfa.com")
    fireEvent.submit(container.querySelector("form") as HTMLFormElement)

    expect(toast.warning).toHaveBeenCalledWith("Informe um e-mail válido.")
    expect(enviar).not.toHaveBeenCalled()
  })

  it("envia o pedido com o e-mail digitado", async () => {
    renderWithProviders(<ForgotPasswordForm />)

    await userEvent.type(campoEmail(), "ana@alfa.com")
    await userEvent.click(enviarBotao())

    await waitFor(() => expect(enviar).toHaveBeenCalled())
    expect(enviar.mock.calls[0][0]).toBe("ana@alfa.com")
  })

  // A confirmação repete o e-mail: é como a pessoa percebe que digitou o
  // endereço errado antes de esperar um link que nunca chega.
  it("troca o formulário pela confirmação, citando o e-mail", async () => {
    renderWithProviders(<ForgotPasswordForm />)

    await userEvent.type(campoEmail(), "ana@alfa.com")
    await userEvent.click(enviarBotao())

    expect(await screen.findByText("ana@alfa.com")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("mostra a mensagem do backend quando o envio falha", async () => {
    enviar.mockRejectedValue(new Error("E-mail não cadastrado."))
    renderWithProviders(<ForgotPasswordForm />)

    await userEvent.type(campoEmail(), "ana@alfa.com")
    await userEvent.click(enviarBotao())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("E-mail não cadastrado."))
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })
})

describe("<ResetPasswordForm />", () => {
  it("desenha os dois campos de senha", () => {
    renderWithProviders(<ResetPasswordForm />)

    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(2)
  })

  it("delega a digitação ao hook", async () => {
    renderWithProviders(<ResetPasswordForm />)

    const [nova] = document.querySelectorAll<HTMLInputElement>('input[type="password"]')
    await userEvent.type(nova, "S")

    expect(setNewPassword).toHaveBeenCalled()
  })

  // Os campos são `required` e o hook está mockado com valor vazio, então o
  // clique no botão é barrado pelo navegador; o submit vai direto no <form>.
  it("delega o envio ao hook", () => {
    const { container } = renderWithProviders(<ResetPasswordForm />)

    fireEvent.submit(container.querySelector("form") as HTMLFormElement)

    expect(handleSubmit).toHaveBeenCalled()
  })

  // Revelar a senha é estado do hook; a tela só troca o `type` do campo.
  it("mostra a senha em texto quando o hook manda", () => {
    mockResetForm({ showPassword: true })

    renderWithProviders(<ResetPasswordForm />)

    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(1)
  })

  it("bloqueia o envio enquanto grava", () => {
    mockResetForm({ isPending: true })

    renderWithProviders(<ResetPasswordForm />)

    expect(screen.getByRole("button", { name: /Salvando/ })).toBeDisabled()
  })
})
