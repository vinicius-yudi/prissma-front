import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Pencil } from "lucide-react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { BottomTabBar } from "../BottomTabBar"

vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, name: "Ana Souza" } }),
}))
vi.mock("@/shared/components/ui/page-chrome/primaryAction", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/components/ui/page-chrome/primaryAction")>()),
  useRegisteredPrimaryAction: vi.fn(),
}))

const { useAccess } = await import("@/shared/hooks/useAccess")
const { useRegisteredPrimaryAction } = await import(
  "@/shared/components/ui/page-chrome/primaryAction"
)
const acesso = vi.mocked(useAccess)
const acaoPrimaria = vi.mocked(useRegisteredPrimaryAction)

/** `ocultos` são módulos que a matriz esconde do papel corrente. */
function mockAcesso(ocultos: AppModule[] = []) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: null,
    isLoading: false,
    levelOf: (m) => (ocultos.includes(m) ? "" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: () => false,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  acaoPrimaria.mockReturnValue(null)
})

describe("<BottomTabBar />", () => {
  it("mostra as abas fixas do celular", () => {
    renderWithProviders(<BottomTabBar />)

    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Obras" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Perfil" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument()
  })

  // A barra tem cinco colunas fixas; "Pessoas & papéis" entrou em
  // WORKSPACE_NAV depois e mora na folha, senão a linha quebraria.
  it("deixa fora da barra o que não é destino frequente", () => {
    renderWithProviders(<BottomTabBar />)

    expect(screen.queryByRole("link", { name: "Pessoas & papéis" })).not.toBeInTheDocument()
  })

  it("esconde a aba que a matriz de acesso oculta do papel", () => {
    mockAcesso(["obras"])

    renderWithProviders(<BottomTabBar />)

    expect(screen.queryByRole("link", { name: "Obras" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument()
  })

  it("marca como ativa a aba da rota corrente", () => {
    renderWithProviders(<BottomTabBar />, { route: "/obras" })

    expect(screen.getByRole("link", { name: "Obras" })).toHaveClass("text-gold-bright")
    expect(screen.getByRole("link", { name: "Início" })).not.toHaveClass("text-gold-bright")
  })
})

/**
 * O FAB central desenha a ação registrada pela tela aberta. A coluna dele
 * existe mesmo sem ação, senão as abas dançariam de posição a cada navegação.
 */
describe("<BottomTabBar /> — FAB", () => {
  it("não desenha botão quando nenhuma tela registrou ação", () => {
    renderWithProviders(<BottomTabBar />)

    expect(screen.queryByRole("button", { name: "Nova obra" })).not.toBeInTheDocument()
  })

  it("desenha a ação registrada e dispara no clique", async () => {
    const onClick = vi.fn()
    acaoPrimaria.mockReturnValue({ label: "Nova obra", onClick })

    renderWithProviders(<BottomTabBar />)
    await userEvent.click(screen.getByRole("button", { name: "Nova obra" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // O espaço sob o disco é de uma palavra: "Adicionar integrante" não cabe.
  it("prefere o rótulo curto sob o disco, mantendo o longo no nome acessível", () => {
    acaoPrimaria.mockReturnValue({
      label: "Adicionar integrante",
      shortLabel: "Integrante",
      onClick: vi.fn(),
    })

    renderWithProviders(<BottomTabBar />)

    expect(screen.getByRole("button", { name: "Adicionar integrante" })).toBeInTheDocument()
    expect(screen.getByText("Integrante")).toBeInTheDocument()
  })

  it("usa o rótulo longo quando não há curto", () => {
    acaoPrimaria.mockReturnValue({ label: "Nova etapa", onClick: vi.fn() })

    renderWithProviders(<BottomTabBar />)

    expect(screen.getByText("Nova etapa")).toBeInTheDocument()
  })

  it("respeita o ícone da tela", () => {
    acaoPrimaria.mockReturnValue({ label: "Editar obra", icon: Pencil, onClick: vi.fn() })

    const { container } = renderWithProviders(<BottomTabBar />)

    expect(container.querySelector(".lucide-pencil")).toBeInTheDocument()
  })

  it("desabilita o FAB quando a tela pede", async () => {
    const onClick = vi.fn()
    acaoPrimaria.mockReturnValue({ label: "Nova tarefa", disabled: true, onClick })

    renderWithProviders(<BottomTabBar />)
    const fab = screen.getByRole("button", { name: "Nova tarefa" })

    expect(fab).toBeDisabled()
    await userEvent.click(fab)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe("<BottomTabBar /> — folha de seções", () => {
  it("começa fechada", () => {
    renderWithProviders(<BottomTabBar />)

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("heading", { name: "Todas as seções" })).not.toBeInTheDocument()
  })

  it("abre no botão Menu", async () => {
    renderWithProviders(<BottomTabBar />)

    await userEvent.click(screen.getByRole("button", { name: "Menu" }))

    expect(screen.getByRole("heading", { name: "Todas as seções" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "true")
  })
})
