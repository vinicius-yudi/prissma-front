import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import type { CadastroFormData } from "../../types"
import { CadastroArquiteto } from "../CadastroArquiteto"
import { CadastroCliente } from "../CadastroCliente"
import { CadastroEngenheiro } from "../CadastroEngenheiro"
import { CadastroForm } from "../CadastroForm"

/**
 * Os três perfis eram arquivos de ~140 linhas com JSX idêntico — só o título e
 * o hook mudavam. Cada um virou um casco fino sobre o próprio hook, e é isso
 * que os testes guardam: o casco repassa, o formulário desenha.
 */
vi.mock("../../hooks/useCadastroArquiteto", () => ({ useCadastroArquiteto: vi.fn() }))
vi.mock("../../hooks/useCadastroEngenheiro", () => ({ useCadastroEngenheiro: vi.fn() }))
vi.mock("../../hooks/useCadastroCliente", () => ({ useCadastroCliente: vi.fn() }))

const { useCadastroArquiteto } = await import("../../hooks/useCadastroArquiteto")
const { useCadastroEngenheiro } = await import("../../hooks/useCadastroEngenheiro")
const { useCadastroCliente } = await import("../../hooks/useCadastroCliente")

const handleChange = vi.fn()
const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
const togglePassword = vi.fn()

const VAZIO: CadastroFormData = { name: "", email: "", password: "", confirmPassword: "" }

/**
 * Os três hooks devolvem a mesma forma, só mudando o nome do campo do form.
 * `isError`/`errorMessage` existem em dois deles e não em outro, então o
 * objeto base carrega os dois e cada `mockReturnValue` afunila para o tipo do
 * seu hook.
 */
function mockHooks(showPassword = false) {
  const comum = {
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: false,
    isError: false,
    errorMessage: undefined,
  }
  vi.mocked(useCadastroArquiteto).mockReturnValue({
    formDataArquiteto: VAZIO,
    ...comum,
  } as ReturnType<typeof useCadastroArquiteto>)
  vi.mocked(useCadastroEngenheiro).mockReturnValue({
    formDataEngenheiro: VAZIO,
    ...comum,
  } as ReturnType<typeof useCadastroEngenheiro>)
  vi.mocked(useCadastroCliente).mockReturnValue({
    formDataCliente: VAZIO,
    ...comum,
  } as ReturnType<typeof useCadastroCliente>)
}

const onBack = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  mockHooks()
})

describe("cascos de cadastro por perfil", () => {
  it.each([
    [<CadastroArquiteto key="a" onBack={onBack} />, "Arquiteto"],
    [<CadastroEngenheiro key="e" onBack={onBack} />, "Engenheiro"],
    [<CadastroCliente key="c" onBack={onBack} />, "Cliente"],
  ])("monta o formulário com o título do perfil (%#)", (pagina, perfil) => {
    renderWithProviders(pagina)

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(new RegExp(perfil, "i"))
    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument()
  })

  it("volta para a escolha de perfil", async () => {
    renderWithProviders(<CadastroArquiteto onBack={onBack} />)

    await userEvent.click(screen.getByRole("button", { name: /Voltar/i }))

    expect(onBack).toHaveBeenCalled()
  })
})

describe("<CadastroForm />", () => {
  function render(showPassword = false, isPending = false) {
    return renderWithProviders(
      <CadastroForm
        title="Criar conta"
        formData={VAZIO}
        showPassword={showPassword}
        isPending={isPending}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onTogglePassword={togglePassword}
        onBack={onBack}
      />,
    )
  }

  it("desenha os quatro campos do cadastro", () => {
    render()

    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument()
    expect(screen.getByLabelText(/E-?mail/i)).toBeInTheDocument()
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(2)
  })

  // `autoComplete` errado quebra o preenchimento do gerenciador de senhas, e é
  // o tipo de atributo que some num refactor sem ninguém notar.
  it("marca os campos para o gerenciador de senhas", () => {
    render()

    expect(screen.getByLabelText(/Nome/)).toHaveAttribute("autocomplete", "name")
    expect(screen.getByLabelText(/E-?mail/i)).toHaveAttribute("autocomplete", "email")
    for (const campo of document.querySelectorAll('input[type="password"]')) {
      expect(campo).toHaveAttribute("autocomplete", "new-password")
    }
  })

  it("delega a digitação ao hook", async () => {
    render()

    await userEvent.type(screen.getByLabelText(/Nome/), "A")

    expect(handleChange).toHaveBeenCalled()
  })

  it("delega o envio ao hook", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }))

    expect(handleSubmit).toHaveBeenCalled()
  })

  // As duas senhas revelam juntas: são a mesma informação sendo conferida.
  it("revela as duas senhas de uma vez", () => {
    render(true)

    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(0)
  })

  it("delega a alternância de visibilidade ao hook", async () => {
    render()

    await userEvent.click(screen.getAllByLabelText("Mostrar senha")[0])

    expect(togglePassword).toHaveBeenCalled()
  })

  it("bloqueia o envio enquanto grava", () => {
    render(false, true)

    expect(screen.getByRole("button", { name: "Realizando cadastro..." })).toBeDisabled()
  })

  it("oferece o atalho para quem já tem conta", () => {
    render()

    expect(screen.getByRole("link")).toHaveAttribute("href", "/login")
  })
})
