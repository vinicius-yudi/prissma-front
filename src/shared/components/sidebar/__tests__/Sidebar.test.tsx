import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import type { Workspace } from "@/shared/types/workspace"
import { renderWithProviders } from "@/test/renderWithProviders"

import { Sidebar } from "../Sidebar"

vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(),
}))
vi.mock("@/shared/hooks/useWorkspaces", () => ({ useWorkspaces: vi.fn() }))
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("@/pages/obra-selecionada/hooks/useObraSelecionada", () => ({
  useObraSelecionada: vi.fn(),
}))
// Os três modais têm testes próprios e trazem consultas de rede junto; aqui
// interessa apenas se a sidebar os abre.
vi.mock("../NewWorkspaceModal", () => ({
  NewWorkspaceModal: ({ open }: { open: boolean }) =>
    open ? <div>modal-nova-conta</div> : null,
}))
vi.mock("@/pages/perfil/components/PerfilModal", () => ({
  PerfilModal: ({ open }: { open: boolean }) => (open ? <div>modal-perfil</div> : null),
}))
vi.mock("@/pages/perfil/components/DeleteAccountModal", () => ({
  DeleteAccountModal: ({ open }: { open: boolean }) =>
    open ? <div>modal-excluir-conta</div> : null,
}))

const { useAccess, useObraIdFromPath } = await import("@/shared/hooks/useAccess")
const { useWorkspaces } = await import("@/shared/hooks/useWorkspaces")
const { useAuth } = await import("@/contexts/AuthContext")
const { useObraSelecionada } = await import("@/pages/obra-selecionada/hooks/useObraSelecionada")

const acesso = vi.mocked(useAccess)
const obraDaUrl = vi.mocked(useObraIdFromPath)
const contas = vi.mocked(useWorkspaces)
const auth = vi.mocked(useAuth)
const obra = vi.mocked(useObraSelecionada)

const logout = vi.fn()
const switchTo = vi.fn()

const CONTA_ALFA: Workspace = {
  id: 1,
  name: "Construtora Alfa",
  document: null,
  status: "ACTIVE",
  isPrimary: true,
  isOwner: true,
}
const CONTA_BETA: Workspace = { ...CONTA_ALFA, id: 2, name: "Construtora Beta", isPrimary: false }

interface AcessoOpts {
  ocultos?: AppModule[]
  somenteLeitura?: AppModule[]
}

function mockAcesso({ ocultos = [], somenteLeitura = [] }: AcessoOpts = {}) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: null,
    isLoading: false,
    levelOf: (m) => (ocultos.includes(m) ? "" : somenteLeitura.includes(m) ? "r" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: (m) => somenteLeitura.includes(m),
  })
}

function mockContas(lista: Workspace[] = [CONTA_ALFA, CONTA_BETA]) {
  contas.mockReturnValue({
    workspaces: lista,
    isLoading: false,
    switchTo,
    isSwitching: false,
    create: vi.fn(),
    isCreating: false,
    createError: null,
  })
}

function painel() {
  return screen.getByRole("complementary")
}

/** A sidebar nasce recolhida e expande no hover — quase tudo depende disso. */
async function expandir() {
  await userEvent.hover(painel())
}

function abrirMenuDaConta() {
  return userEvent.click(screen.getByRole("button", { expanded: false }))
}

/**
 * O menu de conta não tem papel ARIA próprio; o cabeçalho "Contas" é o único
 * ponto de ancoragem estável. Escopar importa porque o nome do usuário e o da
 * conta ativa também aparecem no botão do topo.
 */
function menuDaConta() {
  return within(screen.getByText("Contas").parentElement as HTMLElement)
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  mockContas()
  obraDaUrl.mockReturnValue(null)
  auth.mockReturnValue({
    logout,
    user: { id: 1, name: "Ana Souza" },
    activeWorkspace: { workspaceId: 1 },
  } as unknown as ReturnType<typeof useAuth>)
  obra.mockReturnValue({
    projectQuery: { data: { id: 7, title: "Residencial Alfa" } },
  } as unknown as ReturnType<typeof useObraSelecionada>)
})

describe("<Sidebar /> — trilho e expansão", () => {
  /**
   * Recolhida sobra o ícone: rótulo invisível mas ocupando largura empurrava o
   * ícone para fora do centro do trilho. O nome do módulo migra para o
   * `title`, então o link continua identificável sem texto na tela.
   */
  it("esconde os rótulos enquanto está recolhida, mantendo o título", () => {
    renderWithProviders(<Sidebar />)

    expect(screen.queryByText("Início")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("title", "Início")
  })

  it("mostra os rótulos ao passar o mouse", async () => {
    renderWithProviders(<Sidebar />)

    await expandir()

    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument()
  })

  it("recolhe quando o mouse sai", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()

    await userEvent.unhover(painel())

    expect(screen.queryByText("Início")).not.toBeInTheDocument()
  })

  // Sair do trilho recolhe E fecha o menu junto: um menu pendurado sobre o
  // trilho de 68px ficaria maior que a própria sidebar.
  it("fecha o menu de conta ao recolher", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument()

    await userEvent.unhover(painel())

    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument()
  })
})

describe("<Sidebar /> — navegação", () => {
  it("lista os módulos do workspace fora de uma obra", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()

    expect(screen.getByText("Workspace")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Obras" })).toHaveAttribute("href", "/obras")
  })

  // Os dois níveis se SUBSTITUEM no desktop: dentro de uma obra a nav vira a
  // da obra, não uma lista somada.
  it("troca para os módulos da obra ao entrar numa", async () => {
    obraDaUrl.mockReturnValue(7)

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.getByText("Nesta obra")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Etapas/ })).toHaveAttribute(
      "href",
      "/obras/7/etapas",
    )
    expect(screen.queryByRole("link", { name: "Início" })).not.toBeInTheDocument()
  })

  it("esconde o módulo que a matriz oculta do papel", async () => {
    obraDaUrl.mockReturnValue(7)
    mockAcesso({ ocultos: ["orcamento"] })

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.queryByRole("link", { name: /Orçamento/ })).not.toBeInTheDocument()
  })

  // Acessibilidade §6.
  it("marca com o olho o módulo que o papel só lê", async () => {
    obraDaUrl.mockReturnValue(7)
    mockAcesso({ somenteLeitura: ["orcamento"] })

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.getByRole("link", { name: /Orçamento/ })).toHaveTextContent("👁")
  })

  it("destaca o item da rota corrente", async () => {
    renderWithProviders(<Sidebar />, { route: "/obras" })
    await expandir()

    expect(screen.getByRole("link", { name: "Obras" })).toHaveClass("bg-tint")
    expect(screen.getByRole("link", { name: "Início" })).not.toHaveClass("bg-tint")
  })
})

describe("<Sidebar /> — cartão de contexto da obra", () => {
  it("não aparece fora de uma obra", () => {
    renderWithProviders(<Sidebar />)

    expect(screen.queryByText("Residencial Alfa")).not.toBeInTheDocument()
  })

  it("mostra o nome da obra aberta quando expandida", async () => {
    obraDaUrl.mockReturnValue(7)

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.getByText("Residencial Alfa")).toBeInTheDocument()
  })

  // Enquanto a obra carrega o cartão precisa de um placeholder: sem ele a
  // linha colapsa e o layout dança quando o nome chega.
  it("mostra um traço enquanto o nome da obra não chegou", async () => {
    obraDaUrl.mockReturnValue(7)
    obra.mockReturnValue({ projectQuery: { data: undefined } } as unknown as ReturnType<
      typeof useObraSelecionada
    >)

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("volta para a lista de obras pelo atalho do cartão", async () => {
    obraDaUrl.mockReturnValue(7)

    renderWithProviders(<Sidebar />, { route: "/obras/7/etapas" })
    await expandir()

    expect(screen.getByRole("button", { name: "Todas as obras" })).toBeInTheDocument()
  })
})

describe("<Sidebar /> — menu de conta", () => {
  it("mostra o nome do usuário e a conta ativa", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()

    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.getByText("Construtora Alfa")).toBeInTheDocument()
  })

  it("cai num rótulo genérico enquanto o perfil não carregou", async () => {
    auth.mockReturnValue({
      logout,
      user: null,
      activeWorkspace: null,
    } as unknown as ReturnType<typeof useAuth>)

    renderWithProviders(<Sidebar />)
    await expandir()

    expect(screen.getByText("Usuário")).toBeInTheDocument()
    expect(screen.getByText("Conta pessoal")).toBeInTheDocument()
  })

  it("lista as contas do usuário com a ativa marcada e desabilitada", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()

    await abrirMenuDaConta()

    expect(menuDaConta().getByRole("button", { name: /Construtora Alfa/ })).toBeDisabled()
    expect(menuDaConta().getByRole("button", { name: /Construtora Beta/ })).toBeEnabled()
  })

  it("troca de conta ao escolher outra", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    await userEvent.click(menuDaConta().getByRole("button", { name: /Construtora Beta/ }))

    expect(switchTo).toHaveBeenCalledWith(2)
  })

  // Rollout/carregando: mostrar ao menos a identidade atual evita um menu com
  // a seção "Contas" vazia.
  it("mostra a identidade atual quando ainda não há contas carregadas", async () => {
    mockContas([])

    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    expect(menuDaConta().getByText("Ana Souza")).toBeInTheDocument()
  })

  it("abre o modal de nova conta e fecha o menu", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    await userEvent.click(menuDaConta().getByRole("button", { name: "Nova conta" }))

    expect(screen.getByText("modal-nova-conta")).toBeInTheDocument()
  })

  it("abre o modal de perfil", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    await userEvent.click(screen.getByRole("button", { name: "Perfil" }))

    expect(screen.getByText("modal-perfil")).toBeInTheDocument()
  })

  // Itens do design que ainda não abrem nada ficam desabilitados com o selo —
  // item cinza sem explicação lê como bug.
  it("mantém configurações e ajuda desabilitados com o selo de indisponível", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    expect(screen.getByRole("button", { name: /Configurações/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Ajuda/ })).toBeDisabled()
    expect(screen.getAllByText("Indisponível")).toHaveLength(2)
  })

  it("derruba a sessão no sair", async () => {
    renderWithProviders(<Sidebar />)
    await expandir()
    await abrirMenuDaConta()

    await userEvent.click(screen.getByRole("button", { name: "Sair" }))

    expect(logout).toHaveBeenCalled()
  })

  it("fecha o menu ao clicar fora dele", async () => {
    renderWithProviders(
      <>
        <Sidebar />
        <button type="button">Fora</button>
      </>,
    )
    await expandir()
    await abrirMenuDaConta()

    await userEvent.click(screen.getByRole("button", { name: "Fora" }))

    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument()
  })
})
