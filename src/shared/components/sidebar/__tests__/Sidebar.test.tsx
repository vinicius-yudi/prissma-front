import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import type { Project } from "@/shared/types/project"
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
vi.mock("@/shared/hooks/useProjectList", () => ({ useProjectList: vi.fn() }))
// Os três modais têm testes próprios e trazem consultas de rede junto; aqui
// interessa apenas se a sidebar os abre.
interface ModalDublê {
  open: boolean
  onClose: () => void
  onDeleteAccount?: () => void
}
vi.mock("../NewWorkspaceModal", () => ({
  NewWorkspaceModal: ({ open, onClose }: ModalDublê) =>
    open ? <button onClick={onClose}>modal-nova-conta</button> : null,
}))
vi.mock("@/pages/perfil/components/PerfilModal", () => ({
  PerfilModal: ({ open, onClose, onDeleteAccount }: ModalDublê) =>
    open ? (
      <div>
        modal-perfil
        <button onClick={onClose}>fechar-perfil</button>
        <button onClick={onDeleteAccount}>excluir-conta</button>
      </div>
    ) : null,
}))
vi.mock("@/pages/perfil/components/DeleteAccountModal", () => ({
  DeleteAccountModal: ({ open, onClose }: ModalDublê) =>
    open ? <button onClick={onClose}>modal-excluir-conta</button> : null,
}))

const { useAccess, useObraIdFromPath } = await import("@/shared/hooks/useAccess")
const { useWorkspaces } = await import("@/shared/hooks/useWorkspaces")
const { useAuth } = await import("@/contexts/AuthContext")
const { useProjectList } = await import("@/shared/hooks/useProjectList")

const acesso = vi.mocked(useAccess)
const obraDaUrl = vi.mocked(useObraIdFromPath)
const contas = vi.mocked(useWorkspaces)
const auth = vi.mocked(useAuth)
const obras = vi.mocked(useProjectList)

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

function Url() {
  const { pathname, search } = useLocation()
  return <span data-testid="url">{pathname + search}</span>
}

function abrirMenuDaConta() {
  return userEvent.click(screen.getByRole("button", { expanded: false }))
}

function obra(id: number, title: string, status: Project["status"], plannedEndDate = "2099-12-31"): Project {
  return { id, title, status, plannedStartDate: "2020-01-01", plannedEndDate } as Project
}

/** Escopar importa: o nome do usuário e o da conta também aparecem no botão. */
function menuDaConta() {
  return within(screen.getByRole("menu"))
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
  obras.mockReturnValue([
    obra(7, "Residencial Alfa", "IN_PROGRESS"),
    obra(8, "Café Prado", "IN_PROGRESS", "2020-06-01"),
    obra(9, "Clínica Água Verde", "PLANNING"),
  ])
})

describe("<Sidebar /> — recolher e expandir", () => {
  it("nasce aberta com os rótulos", () => {
    renderWithProviders(<Sidebar />)

    expect(within(painel()).getByText("Obras")).toBeInTheDocument()
  })

  // Recolhida, sobra o trilho de ícones: o nome vai para o `title`.
  it("recolhe para o trilho e lembra a escolha", async () => {
    renderWithProviders(<Sidebar />)

    await userEvent.click(screen.getByRole("button", { name: "Recolher menu" }))

    expect(within(painel()).queryByText("Obras")).not.toBeInTheDocument()
    expect(screen.getByTitle("Obras")).toBeInTheDocument()
    expect(localStorage.getItem("prissma-sidebar-collapsed")).toBe("1")
  })

  it("expande de novo pelo rodapé", async () => {
    localStorage.setItem("prissma-sidebar-collapsed", "1")
    renderWithProviders(<Sidebar />)

    await userEvent.click(screen.getByRole("button", { name: "Expandir menu" }))

    expect(within(painel()).getByText("Obras")).toBeInTheDocument()
  })
})

describe("<Sidebar /> — navegação", () => {
  it("lista os módulos do workspace", () => {
    renderWithProviders(<Sidebar />)

    // A marca no topo também leva ao início; o item da navegação é o de texto.
    const nav = within(screen.getByRole("navigation"))
    expect(nav.getByRole("link", { name: /Início/ })).toHaveAttribute("href", "/dashboard")
    expect(screen.getByRole("link", { name: /^Obras$/ })).toHaveAttribute("href", "/obras")
  })

  it("esconde o módulo que a matriz oculta do papel", () => {
    mockAcesso({ ocultos: ["pessoas"] })

    renderWithProviders(<Sidebar />)

    expect(screen.queryByRole("link", { name: /Pessoas/ })).not.toBeInTheDocument()
  })

  it("marca com o olho o módulo que o papel só lê", () => {
    mockAcesso({ somenteLeitura: ["obras"] })

    renderWithProviders(<Sidebar />)

    expect(screen.getByLabelText("Somente leitura no seu perfil")).toBeInTheDocument()
  })

  it("destaca o item da rota corrente", () => {
    renderWithProviders(<Sidebar />, { route: "/obras" })

    expect(screen.getByRole("link", { name: /^Obras$/ })).toHaveAttribute("aria-current", "page")
  })
})

describe("<Sidebar /> — obras em andamento", () => {
  it("lista só as obras em andamento, apontando para cada uma", () => {
    renderWithProviders(<Sidebar />)

    expect(screen.getByRole("link", { name: /Residencial Alfa/ })).toHaveAttribute("href", "/obras/7")
    expect(screen.getByRole("link", { name: /Café Prado/ })).toBeInTheDocument()
    expect(screen.queryByText("Clínica Água Verde")).not.toBeInTheDocument()
  })

  it("abre o cadastro de obra pelo atalho", async () => {
    renderWithProviders(
      <>
        <Sidebar />
        <Url />
      </>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Nova obra" }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras?nova=1")
  })

  it("esconde o atalho de nova obra de quem só lê obras", () => {
    mockAcesso({ somenteLeitura: ["obras"] })

    renderWithProviders(<Sidebar />)

    expect(screen.queryByRole("button", { name: "Nova obra" })).not.toBeInTheDocument()
  })
})

describe("<Sidebar /> — menu de conta", () => {
  it("mostra o nome do usuário e a conta ativa", async () => {
    renderWithProviders(<Sidebar />)

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

    expect(screen.getByText("Usuário")).toBeInTheDocument()
    expect(screen.getByText("Conta pessoal")).toBeInTheDocument()
  })

  it("lista as contas do usuário com a ativa marcada e desabilitada", async () => {
    renderWithProviders(<Sidebar />)

    await abrirMenuDaConta()

    expect(menuDaConta().getByRole("menuitem", { name: /Construtora Alfa/ })).toBeDisabled()
    expect(menuDaConta().getByRole("menuitem", { name: /Construtora Beta/ })).toBeEnabled()
  })

  it("troca de conta ao escolher outra", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.click(menuDaConta().getByRole("menuitem", { name: /Construtora Beta/ }))

    expect(switchTo).toHaveBeenCalledWith(2)
  })

  // Rollout/carregando: mostrar ao menos a identidade atual evita um menu com
  // a seção "Contas" vazia.
  it("mostra a identidade atual quando ainda não há contas carregadas", async () => {
    mockContas([])

    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    expect(menuDaConta().getByText("Ana Souza")).toBeInTheDocument()
  })

  it("abre o modal de nova conta e fecha o menu", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.click(menuDaConta().getByRole("menuitem", { name: "Nova conta" }))

    expect(screen.getByText("modal-nova-conta")).toBeInTheDocument()
  })

  // Do perfil sai a exclusão de conta: um modal fecha para o outro abrir.
  it("passa do perfil para a exclusão de conta e fecha cada modal", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()
    await userEvent.click(screen.getByRole("menuitem", { name: "Perfil" }))

    await userEvent.click(screen.getByRole("button", { name: "excluir-conta" }))
    expect(screen.queryByText("modal-perfil")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "modal-excluir-conta" }))
    expect(screen.queryByText("modal-excluir-conta")).not.toBeInTheDocument()
  })

  it("fecha o perfil e a nova conta", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()
    await userEvent.click(screen.getByRole("menuitem", { name: "Perfil" }))
    await userEvent.click(screen.getByRole("button", { name: "fechar-perfil" }))
    expect(screen.queryByText("modal-perfil")).not.toBeInTheDocument()

    await abrirMenuDaConta()
    await userEvent.click(menuDaConta().getByRole("menuitem", { name: "Nova conta" }))
    await userEvent.click(screen.getByRole("button", { name: "modal-nova-conta" }))
    expect(screen.queryByText("modal-nova-conta")).not.toBeInTheDocument()
  })

  it("abre o modal de perfil", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.click(screen.getByRole("menuitem", { name: "Perfil" }))

    expect(screen.getByText("modal-perfil")).toBeInTheDocument()
  })

  // Itens do design que ainda não abrem nada ficam desabilitados com o selo —
  // item cinza sem explicação lê como bug.
  it("mantém configurações e ajuda desabilitados com o selo de indisponível", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    expect(screen.getByRole("menuitem", { name: /Configurações/ })).toBeDisabled()
    expect(screen.getByRole("menuitem", { name: /Ajuda/ })).toBeDisabled()
    expect(screen.getAllByText("Indisponível")).toHaveLength(2)
  })

  it("derruba a sessão no sair", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.click(screen.getByRole("menuitem", { name: "Sair" }))

    expect(logout).toHaveBeenCalled()
  })

  it("fecha o menu ao clicar fora dele", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.click(document.querySelector("[aria-hidden=true].fixed") as HTMLElement)

    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("fecha o menu no Esc", async () => {
    renderWithProviders(<Sidebar />)
    await abrirMenuDaConta()

    await userEvent.keyboard("{Escape}")

    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })
})
