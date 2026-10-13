import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { cadastroArquiteto } from "@/pages/cadastro/services/cadastroArquiteto.service"
import { cadastroCliente } from "@/pages/cadastro/services/cadastroCliente.service"
import { cadastroEngenheiro } from "@/pages/cadastro/services/cadastroEngenheiro.service"
import { CadastroPage } from "@/pages/cadastro"
import { ForgotPasswordPage } from "@/pages/forgot-password"
import { forgotPassword } from "@/pages/forgot-password/services/forgot-password.service"
import { LoginPage } from "@/pages/login"
import { login } from "@/pages/login/services/login.service"
import { ResetPasswordPage } from "@/pages/reset-password"
import { resetPassword } from "@/pages/reset-password/services/reset-password.service"
import { renderWithProviders } from "@/test/renderWithProviders"

const saveToken = vi.fn()
const logout = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ saveToken, logout }) }))
vi.mock("@/pages/login/services/login.service", () => ({ login: vi.fn() }))
vi.mock("@/pages/cadastro/services/cadastroArquiteto.service", () => ({ cadastroArquiteto: vi.fn() }))
vi.mock("@/pages/cadastro/services/cadastroCliente.service", () => ({ cadastroCliente: vi.fn() }))
vi.mock("@/pages/cadastro/services/cadastroEngenheiro.service", () => ({ cadastroEngenheiro: vi.fn() }))
vi.mock("@/pages/forgot-password/services/forgot-password.service", () => ({ forgotPassword: vi.fn() }))
vi.mock("@/pages/reset-password/services/reset-password.service", () => ({ resetPassword: vi.fn() }))

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-toastify")>()),
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}))

function Url() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

/** A página na rota pedida, mais uma sonda de URL para ver os redirecionamentos. */
function renderAt(path: string, element: React.ReactElement, route = path) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path={path} element={element} />
        <Route path="*" element={null} />
      </Routes>
      <Url />
    </>,
    { route },
  )
}

const FORTE = "Obra@2026"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("casca das telas públicas", () => {
  it("mostra a marca com o formulário e o painel da torre ao lado", () => {
    renderAt("/login", <LoginPage />)

    expect(screen.getAllByRole("img", { name: "PRISSMA" }).length).toBeGreaterThan(0)
    expect(screen.getByText("Controle total")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Entrar/ })).toBeInTheDocument()
  })
})

describe("<LoginPage />", () => {
  // Erro de campo vai no campo, não em toast.
  it("mostra os erros nos campos e não chama o servidor", async () => {
    renderAt("/login", <LoginPage />)

    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }))

    expect(await screen.findByText("Digite o e-mail.")).toBeInTheDocument()
    expect(screen.getByText("Digite a senha.")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true")
    expect(login).not.toHaveBeenCalled()
  })

  it("entra, derruba a sessão anterior e vai ao painel", async () => {
    vi.mocked(login).mockResolvedValue({ token: "tok" })
    renderAt("/login", <LoginPage />)

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.type(screen.getByLabelText("Senha"), "senha123")
    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }))

    await waitFor(() => expect(saveToken).toHaveBeenCalledWith("tok"))
    expect(logout).toHaveBeenCalled()
    expect(login).toHaveBeenCalledWith({ email: "ana@obra.com", password: "senha123" }, expect.anything())
    expect(screen.getByTestId("url")).toHaveTextContent("/dashboard")
  })

  it.each([
    ["Invalid credentials", "E-mail ou senha incorretos."],
    ["boom", "Não foi possível entrar agora. Tente de novo em instantes."],
  ])("traduz o erro do servidor %s", async (mensagem, esperado) => {
    vi.mocked(login).mockRejectedValue(new Error(mensagem))
    renderAt("/login", <LoginPage />)

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.type(screen.getByLabelText("Senha"), "senha123")
    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(esperado))
  })

  it("mostra e oculta a senha", async () => {
    renderAt("/login", <LoginPage />)

    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }))

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text")
  })
})

describe("<CadastroPage />", () => {
  it.each([
    ["Engenheiro(a)", cadastroEngenheiro, "Conta de engenheiro(a)"],
    ["Arquiteto(a)", cadastroArquiteto, "Conta de arquiteto(a)"],
    ["Proprietário(a)", cadastroCliente, "Conta de proprietário(a)"],
  ])("cadastra %s pelo serviço do perfil e já entra", async (perfil, servico, titulo) => {
    vi.mocked(servico).mockResolvedValue({ token: "novo" })
    renderAt("/cadastro", <CadastroPage />)

    await userEvent.click(screen.getByRole("button", { name: new RegExp(perfil.replace(/[()]/g, "\\$&")) }))
    expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("Nome completo"), "Ana Souza")
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.type(screen.getByLabelText("Senha"), FORTE)
    await userEvent.type(screen.getByLabelText("Confirme a senha"), FORTE)
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    await waitFor(() => expect(saveToken).toHaveBeenCalledWith("novo"))
    expect(servico).toHaveBeenCalledWith(
      { name: "Ana Souza", email: "ana@obra.com", password: FORTE, confirmPassword: FORTE },
      expect.anything(),
    )
  })

  // A lista marca cada regra enquanto o usuário digita.
  it("marca as regras da senha conforme digita", async () => {
    renderAt("/cadastro", <CadastroPage />)
    await userEvent.click(screen.getByRole("button", { name: /Engenheiro/ }))

    await userEvent.type(screen.getByLabelText("Senha"), "obra")

    expect(screen.getByText("Uma letra minúscula").closest("li")).toHaveAttribute("data-passed", "true")
    expect(screen.getByText("Uma letra maiúscula").closest("li")).toHaveAttribute("data-passed", "false")
  })

  it("acusa senhas diferentes no campo de confirmação", async () => {
    renderAt("/cadastro", <CadastroPage />)
    await userEvent.click(screen.getByRole("button", { name: /Engenheiro/ }))

    await userEvent.type(screen.getByLabelText("Nome completo"), "Ana Souza")
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.type(screen.getByLabelText("Senha"), FORTE)
    await userEvent.type(screen.getByLabelText("Confirme a senha"), "Outra@2026")
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    expect(await screen.findByText("As senhas não coincidem.")).toBeInTheDocument()
    expect(cadastroEngenheiro).not.toHaveBeenCalled()
  })

  it.each([
    ["Email já cadastrado", "Este e-mail já tem conta. Entre ou recupere a senha."],
    ["boom", "Não foi possível criar a conta agora. Tente de novo em instantes."],
  ])("traduz o erro do servidor %s", async (mensagem, esperado) => {
    vi.mocked(cadastroCliente).mockRejectedValue(new Error(mensagem))
    renderAt("/cadastro", <CadastroPage />)
    await userEvent.click(screen.getByRole("button", { name: /Proprietário/ }))

    await userEvent.type(screen.getByLabelText("Nome completo"), "Ana Souza")
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.type(screen.getByLabelText("Senha"), FORTE)
    await userEvent.type(screen.getByLabelText("Confirme a senha"), FORTE)
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(esperado))
  })

  it("volta para a escolha do perfil", async () => {
    renderAt("/cadastro", <CadastroPage />)
    await userEvent.click(screen.getByRole("button", { name: /Arquiteto/ }))

    await userEvent.click(screen.getByRole("button", { name: "Trocar tipo de conta" }))

    expect(screen.getByRole("heading", { name: "Crie sua conta" })).toBeInTheDocument()
  })
})

describe("<ForgotPasswordPage />", () => {
  it("pede o link e confirma para qual e-mail foi", async () => {
    vi.mocked(forgotPassword).mockResolvedValue(undefined)
    renderAt("/forgot-password", <ForgotPasswordPage />)

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }))

    expect(await screen.findByRole("heading", { name: "Confira seu e-mail" })).toBeInTheDocument()
    expect(screen.getByText("ana@obra.com")).toBeInTheDocument()
    expect(forgotPassword).toHaveBeenCalledWith("ana@obra.com", expect.anything())
  })

  it("valida o e-mail no campo e mostra o erro do servidor em toast", async () => {
    vi.mocked(forgotPassword).mockRejectedValue(new Error("Falhou"))
    renderAt("/forgot-password", <ForgotPasswordPage />)

    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }))
    expect(await screen.findByText("Digite o e-mail.")).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@obra.com")
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Falhou"))
  })
})

describe("<ResetPasswordPage />", () => {
  // Link sem token não tem o que redefinir: volta para pedir outro.
  it("manda pedir outro link quando falta o token", () => {
    renderAt("/reset-password", <ResetPasswordPage />)

    expect(screen.getByTestId("url")).toHaveTextContent("/forgot-password")
  })

  it("redefine com o token do link e leva ao login", async () => {
    vi.mocked(resetPassword).mockResolvedValue(undefined)
    renderAt("/reset-password", <ResetPasswordPage />, "/reset-password?token=abc")

    await userEvent.type(screen.getByLabelText("Nova senha"), FORTE)
    await userEvent.type(screen.getByLabelText("Confirme a senha"), FORTE)
    await userEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith("abc", FORTE))
    expect(toastSuccess).toHaveBeenCalledWith("Senha redefinida. Entre com a senha nova.")
    expect(screen.getByTestId("url")).toHaveTextContent("/login")
  })

  it("mostra a regra que falta e o erro do servidor", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error("Token expirado"))
    renderAt("/reset-password", <ResetPasswordPage />, "/reset-password?token=abc")

    await userEvent.type(screen.getByLabelText("Nova senha"), "fraca")
    await userEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))
    expect(await screen.findByText("A senha ainda não cumpre todas as regras abaixo.")).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText("Nova senha"))
    await userEvent.type(screen.getByLabelText("Nova senha"), FORTE)
    await userEvent.type(screen.getByLabelText("Confirme a senha"), FORTE)
    await userEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Token expirado"))
  })
})
