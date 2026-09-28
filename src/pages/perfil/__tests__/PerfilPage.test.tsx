import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"

import { PerfilForm } from "../components/PerfilForm"
import { PerfilPage } from "../index"

const logout = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../services/perfil.service", () => ({
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { useAuth } = await import("@/contexts/AuthContext")
const auth = vi.mocked(useAuth)
const buscarPerfil = vi.mocked(getMyProfile)

const PERFIL = { id: 42, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

const onClose = vi.fn()
const onDeleteAccount = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  auth.mockReturnValue({ user: PERFIL, logout } as unknown as ReturnType<typeof useAuth>)
  buscarPerfil.mockResolvedValue(PERFIL)
})

/**
 * A tela de Perfil é rota, não folha: a barra de abas do celular navega por
 * URL, e uma tela endereçável pode ser recarregada e compartilhada.
 */
describe("<PerfilPage />", () => {
  it("mostra nome e e-mail do usuário logado", () => {
    renderWithProviders(<PerfilPage />)

    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.getByText("ana@alfa.com")).toBeInTheDocument()
  })

  it("cai em rótulos genéricos enquanto o perfil não carregou", () => {
    auth.mockReturnValue({ user: null, logout } as unknown as ReturnType<typeof useAuth>)

    renderWithProviders(<PerfilPage />)

    expect(screen.getByText("Usuário")).toBeInTheDocument()
    expect(screen.getByText("Conta pessoal")).toBeInTheDocument()
  })

  // Tema e idioma saem do header no celular por falta de espaço e reaparecem
  // aqui.
  it("reúne as preferências de tema e idioma", () => {
    renderWithProviders(<PerfilPage />)

    expect(screen.getByText("Tema")).toBeInTheDocument()
    expect(screen.getByText("Idioma")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /modo/ })).toBeInTheDocument()
  })

  it("mantém configurações e ajuda desabilitados com o selo", () => {
    renderWithProviders(<PerfilPage />)

    expect(screen.getByRole("button", { name: /Configurações/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Ajuda/ })).toBeDisabled()
    expect(screen.getAllByText("Indisponível")).toHaveLength(2)
  })

  it("derruba a sessão no sair", async () => {
    renderWithProviders(<PerfilPage />)

    await userEvent.click(screen.getByRole("button", { name: "Sair" }))

    expect(logout).toHaveBeenCalled()
  })

  it("abre o modal de perfil", async () => {
    renderWithProviders(<PerfilPage />)

    await userEvent.click(screen.getByRole("button", { name: "Perfil" }))

    expect(await screen.findByRole("heading", { name: /Perfil|perfil/ })).toBeInTheDocument()
  })
})

describe("<PerfilForm />", () => {
  function render() {
    return renderWithProviders(
      <PerfilForm open onClose={onClose} onDeleteAccount={onDeleteAccount} />,
    )
  }

  it("avisa enquanto o perfil carrega", () => {
    buscarPerfil.mockImplementation(() => new Promise(() => {}))

    render()

    expect(screen.getByText(/Carregando/)).toBeInTheDocument()
  })

  it("preenche os campos com o perfil do usuário", async () => {
    render()

    expect(await screen.findByLabelText("Nome")).toHaveValue("Ana Souza")
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@alfa.com")
  })

  // Só engenheiro e cliente são escolhíveis pelo próprio usuário; ADMIN é
  // staff da plataforma e ARQ ainda não entrou no seletor.
  it("oferece só os papéis que o usuário pode escolher", async () => {
    render()
    await screen.findByLabelText("Nome")

    expect(screen.getAllByRole("option")).toHaveLength(2)
  })

  it("alterna a visibilidade da nova senha", async () => {
    render()
    const senha = await screen.findByLabelText("Nova senha")
    expect(senha).toHaveAttribute("type", "password")

    await userEvent.click(senha.parentElement!.querySelector("button")!)

    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "text")
  })

  it("alterna a visibilidade da confirmação de forma independente", async () => {
    render()
    const confirmacao = await screen.findByLabelText("Confirmar nova senha")

    await userEvent.click(confirmacao.parentElement!.querySelector("button")!)

    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("type", "text")
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password")
  })

  it("chama o fluxo de exclusão de conta", async () => {
    render()
    await screen.findByLabelText("Nome")

    await userEvent.click(screen.getByRole("button", { name: /Deletar conta/ }))

    expect(onDeleteAccount).toHaveBeenCalled()
  })
})
