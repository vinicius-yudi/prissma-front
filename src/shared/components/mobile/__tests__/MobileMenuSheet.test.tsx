import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { MobileMenuSheet } from "../MobileMenuSheet"

vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(),
}))
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("@/shared/components/ui/page-chrome/primaryAction", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/components/ui/page-chrome/primaryAction")>()),
  useRegisteredPrimaryAction: vi.fn(),
}))

const { useAccess, useObraIdFromPath } = await import("@/shared/hooks/useAccess")
const { useAuth } = await import("@/contexts/AuthContext")
const { useRegisteredPrimaryAction } = await import(
  "@/shared/components/ui/page-chrome/primaryAction"
)
const acesso = vi.mocked(useAccess)
const obraDaUrl = vi.mocked(useObraIdFromPath)
const auth = vi.mocked(useAuth)
const acaoPrimaria = vi.mocked(useRegisteredPrimaryAction)

interface AcessoOpts {
  ocultos?: AppModule[]
  somenteLeitura?: AppModule[]
}

function mockAcesso({ ocultos = [], somenteLeitura = [] }: AcessoOpts = {}) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: (m) => (ocultos.includes(m) ? "" : somenteLeitura.includes(m) ? "r" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: (m) => somenteLeitura.includes(m),
  })
}

const onClose = vi.fn()

function render(route = "/dashboard") {
  return renderWithProviders(<MobileMenuSheet open onClose={onClose} />, { route })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  obraDaUrl.mockReturnValue(null)
  acaoPrimaria.mockReturnValue(null)
  auth.mockReturnValue({ user: { id: 1, name: "Ana Souza" } } as ReturnType<typeof useAuth>)
})

describe("<MobileMenuSheet />", () => {
  it("não renderiza nada fechada", () => {
    renderWithProviders(<MobileMenuSheet open={false} onClose={onClose} />)

    expect(screen.queryByRole("heading", { name: "Todas as seções" })).not.toBeInTheDocument()
  })

  it("lista os módulos do workspace fora de uma obra", () => {
    render()

    expect(screen.getByText("Workspace")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Pessoas & papéis/ })).toBeInTheDocument()
    expect(screen.queryByText("Nesta obra")).not.toBeInTheDocument()
  })

  /**
   * Dentro de uma obra a folha empilha os dois níveis — no celular sair da
   * obra e voltar custa dois toques a mais do que no desktop, onde os níveis
   * se substituem.
   */
  it("empilha os dois níveis dentro de uma obra", () => {
    obraDaUrl.mockReturnValue(7)

    render("/obras/7/etapas")

    expect(screen.getByText("Nesta obra")).toBeInTheDocument()
    expect(screen.getByText("Workspace")).toBeInTheDocument()
  })

  // Os caminhos do nível 2 são relativos na constante; a folha precisa
  // prefixá-los com a obra aberta, ou o link cairia na raiz.
  it("aponta os módulos da obra para a obra aberta", () => {
    obraDaUrl.mockReturnValue(7)

    render("/obras/7/etapas")

    expect(screen.getByRole("link", { name: /Etapas/ })).toHaveAttribute(
      "href",
      "/obras/7/etapas",
    )
  })

  it("mantém absolutos os caminhos do nível 1", () => {
    obraDaUrl.mockReturnValue(7)

    render("/obras/7/etapas")

    expect(screen.getByRole("link", { name: /Obras/ })).toHaveAttribute("href", "/obras")
  })

  // A lista sai da mesma interseção de sempre: nenhum módulo oculto reaparece
  // por este caminho.
  it("esconde o que a matriz oculta do papel", () => {
    obraDaUrl.mockReturnValue(7)
    mockAcesso({ ocultos: ["orcamento"] })

    render("/obras/7/etapas")

    expect(screen.queryByRole("link", { name: /Orçamento/ })).not.toBeInTheDocument()
  })

  it("omite o grupo inteiro quando nenhum módulo dele é visível", () => {
    mockAcesso({ ocultos: ["home", "obras", "pessoas"] })

    render()

    expect(screen.queryByText("Workspace")).not.toBeInTheDocument()
  })

  // Acessibilidade §6: somente-leitura é sinalizado aqui também.
  it("marca com o olho o módulo que o papel só lê", () => {
    obraDaUrl.mockReturnValue(7)
    mockAcesso({ somenteLeitura: ["orcamento"] })

    render("/obras/7/etapas")

    expect(screen.getByRole("link", { name: /Orçamento/ })).toHaveTextContent("👁")
    expect(screen.getByRole("link", { name: /Etapas/ })).not.toHaveTextContent("👁")
  })

  it("destaca o item da rota corrente", () => {
    obraDaUrl.mockReturnValue(7)

    render("/obras/7/etapas")

    expect(screen.getByRole("link", { name: /Etapas/ })).toHaveClass("font-semibold")
  })

  it("fecha ao navegar para um módulo", async () => {
    render()

    await userEvent.click(screen.getByRole("link", { name: /Início/ }))

    expect(onClose).toHaveBeenCalled()
  })
})

describe("<MobileMenuSheet /> — cabeçalho e ação", () => {
  it("mostra o nome do usuário logado", () => {
    render()

    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
  })

  it("cai num rótulo genérico enquanto o perfil não carregou", () => {
    auth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>)

    render()

    expect(screen.getByText("Usuário")).toBeInTheDocument()
  })

  it("fecha e vai ao perfil no cartão do usuário", async () => {
    render()

    await userEvent.click(screen.getByText("Ana Souza"))

    expect(onClose).toHaveBeenCalled()
  })

  it("não repete a ação da tela quando não há nenhuma registrada", () => {
    render()

    expect(screen.queryByRole("button", { name: "Nova obra" })).not.toBeInTheDocument()
  })

  // Com a folha aberta o FAB fica sob o scrim: a ação da tela é repetida aqui
  // em largura total.
  it("repete a ação registrada, fechando a folha antes de executá-la", async () => {
    const onClick = vi.fn()
    acaoPrimaria.mockReturnValue({ label: "Nova obra", onClick })

    render()
    await userEvent.click(screen.getByRole("button", { name: "Nova obra" }))

    expect(onClose).toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("desabilita a ação repetida quando a tela pede", () => {
    acaoPrimaria.mockReturnValue({ label: "Nova obra", disabled: true, onClick: vi.fn() })

    render()

    expect(screen.getByRole("button", { name: "Nova obra" })).toBeDisabled()
  })
})
