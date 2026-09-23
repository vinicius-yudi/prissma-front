import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  deactivateMember,
  getWorkspaceMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/shared/services/workspace.service"
import { WorkspaceRole, type WorkspaceMember } from "@/shared/types/workspace"
import { renderWithProviders } from "@/test/renderWithProviders"

import { PessoasPage } from "../index"

vi.mock("@/shared/services/workspace.service", () => ({
  getWorkspaceMembers: vi.fn(),
  inviteMember: vi.fn(),
  updateMemberRole: vi.fn(),
  deactivateMember: vi.fn(),
  removeMember: vi.fn(),
  getWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  switchWorkspace: vi.fn(),
  acceptInvite: vi.fn(),
}))
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { useAuth } = await import("@/contexts/AuthContext")
const auth = vi.mocked(useAuth)
const listar = vi.mocked(getWorkspaceMembers)
const convidar = vi.mocked(inviteMember)
const trocarPapel = vi.mocked(updateMemberRole)
const desativar = vi.mocked(deactivateMember)
const remover = vi.mocked(removeMember)

const EU_ID = 1

function membro(over: Partial<WorkspaceMember> = {}): WorkspaceMember {
  return {
    id: 10,
    userId: 2,
    name: "Bia Lima",
    email: "bia@alfa.com",
    role: WorkspaceRole.MEMBER,
    active: true,
    acceptedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

/** `papelNaConta` decide o que a tela oferece; o gate real é o backend. */
function mockAuth(papelNaConta: WorkspaceRole | null = WorkspaceRole.OWNER) {
  auth.mockReturnValue({
    user: { id: EU_ID, name: "Ana Souza" },
    activeWorkspace: papelNaConta ? { workspaceId: 1, workspaceRole: papelNaConta } : null,
  } as unknown as ReturnType<typeof useAuth>)
}

function render() {
  return renderWithProviders(<PessoasPage />)
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAuth()
  listar.mockResolvedValue([membro()])
  convidar.mockResolvedValue({
    invitedEmail: "novo@alfa.com",
    role: WorkspaceRole.MEMBER,
    expiresAt: "2026-03-01T00:00:00Z",
  })
  trocarPapel.mockResolvedValue(membro())
  desativar.mockResolvedValue({ ...membro(), active: false })
  remover.mockResolvedValue(undefined)
})

describe("<PessoasPage /> — listagem", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3)
  })

  it("avisa quando a consulta falha", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    render()

    expect(await screen.findByText("Não foi possível carregar a equipe.")).toBeInTheDocument()
  })

  it("avisa quando a conta não tem equipe", async () => {
    listar.mockResolvedValue([])

    render()

    expect(
      await screen.findByText("Nenhum membro ainda. Convide alguém para começar."),
    ).toBeInTheDocument()
  })

  it("lista nome e e-mail dos membros", async () => {
    render()

    expect(await screen.findByText("Bia Lima")).toBeInTheDocument()
    expect(screen.getByText("bia@alfa.com")).toBeInTheDocument()
  })

  /**
   * Cliente é membro da conta com papel CLIENT: aparece nas obras dele, não na
   * equipe da construtora. Listá-lo aqui misturaria dois públicos.
   */
  it("deixa os clientes fora da equipe da conta", async () => {
    listar.mockResolvedValue([
      membro(),
      membro({ id: 11, userId: 3, name: "Cliente Alfa", role: WorkspaceRole.CLIENT }),
    ])

    render()

    expect(await screen.findByText("Bia Lima")).toBeInTheDocument()
    expect(screen.queryByText("Cliente Alfa")).not.toBeInTheDocument()
  })

  // Convite aceito, convite pendente e conta desativada são três estados
  // distintos, e cada um pede uma ação diferente de quem administra.
  it("marca o membro inativo", async () => {
    listar.mockResolvedValue([membro({ active: false })])

    render()

    expect(await screen.findByText("Inativo")).toBeInTheDocument()
  })

  it("marca o convite ainda não aceito", async () => {
    listar.mockResolvedValue([membro({ acceptedAt: null })])

    render()

    expect(await screen.findByText("Pendente")).toBeInTheDocument()
  })

  it("cai no e-mail quando o membro ainda não tem nome", async () => {
    listar.mockResolvedValue([membro({ name: null })])

    render()

    expect(await screen.findAllByText("bia@alfa.com")).toHaveLength(2)
  })
})

/**
 * A hierarquia é do backend; a tela só evita oferecer o botão que daria 403.
 */
describe("<PessoasPage /> — quem pode gerenciar quem", () => {
  it("esconde as ações de quem não administra a conta", async () => {
    mockAuth(WorkspaceRole.MEMBER)

    render()

    await screen.findByText("Bia Lima")
    expect(screen.queryByRole("button", { name: /Convidar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("não deixa o usuário gerenciar a si mesmo", async () => {
    listar.mockResolvedValue([membro({ userId: EU_ID, name: "Ana Souza" })])

    render()

    await screen.findByText("Ana Souza")
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("não deixa gerenciar o dono da conta", async () => {
    listar.mockResolvedValue([membro({ role: WorkspaceRole.OWNER })])

    render()

    await screen.findByText("Bia Lima")
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  // ADMIN não gerencia outro ADMIN: só o OWNER está acima deles.
  it("não deixa um admin gerenciar outro admin", async () => {
    mockAuth(WorkspaceRole.ADMIN)
    listar.mockResolvedValue([membro({ role: WorkspaceRole.ADMIN })])

    render()

    await screen.findByText("Bia Lima")
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("mostra o papel como texto quando não há ação possível", async () => {
    mockAuth(WorkspaceRole.MEMBER)

    render()

    expect(await screen.findByText("Membro")).toBeInTheDocument()
  })
})

describe("<PessoasPage /> — ações sobre o membro", () => {
  it("troca o papel pelo seletor", async () => {
    render()
    await screen.findByText("Bia Lima")

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Mudar papel" }),
      WorkspaceRole.ADMIN,
    )

    await waitFor(() => expect(trocarPapel).toHaveBeenCalledWith(10, WorkspaceRole.ADMIN))
  })

  it("desativa o membro", async () => {
    render()
    await screen.findByText("Bia Lima")

    await userEvent.click(screen.getByTitle("Desativar"))

    await waitFor(() => expect(desativar).toHaveBeenCalledWith(10))
  })

  // Membro já inativo não tem o que desativar de novo.
  it("não oferece desativar quem já está inativo", async () => {
    listar.mockResolvedValue([membro({ active: false })])

    render()

    await screen.findByText("Bia Lima")
    expect(screen.queryByTitle("Desativar")).not.toBeInTheDocument()
  })

  it("pede confirmação antes de remover", async () => {
    render()
    await screen.findByText("Bia Lima")

    await userEvent.click(screen.getByTitle("Remover"))

    expect(screen.getByText(/Remover Bia Lima da conta/)).toBeInTheDocument()
    expect(remover).not.toHaveBeenCalled()
  })

  it("remove ao confirmar", async () => {
    render()
    await screen.findByText("Bia Lima")
    await userEvent.click(screen.getByTitle("Remover"))

    // O ✕ da linha também se chama "Remover"; o do modal é o último, já que o
    // portal monta depois da lista.
    const botoes = screen.getAllByRole("button", { name: "Remover" })
    await userEvent.click(botoes[botoes.length - 1])

    await waitFor(() => expect(remover).toHaveBeenCalledWith(10))
  })

  it("desiste sem remover no cancelar", async () => {
    render()
    await screen.findByText("Bia Lima")
    await userEvent.click(screen.getByTitle("Remover"))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(remover).not.toHaveBeenCalled()
  })
})

describe("<PessoasPage /> — convite", () => {
  async function abrirConvite() {
    render()
    await screen.findByText("Bia Lima")
    await userEvent.click(screen.getByRole("button", { name: /Convidar/ }))
  }

  it("abre o formulário de convite", async () => {
    await abrirConvite()

    expect(screen.getByRole("heading", { name: "Convidar para a conta" })).toBeInTheDocument()
  })

  it("convida com e-mail, nome e papel", async () => {
    await abrirConvite()

    await userEvent.type(screen.getByLabelText("E-mail"), "novo@alfa.com")
    await userEvent.type(screen.getByLabelText("Nome (opcional)"), "Novo Membro")
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Papel na conta" }),
      WorkspaceRole.ADMIN,
    )
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }))

    await waitFor(() =>
      expect(convidar).toHaveBeenCalledWith({
        email: "novo@alfa.com",
        fullName: "Novo Membro",
        role: WorkspaceRole.ADMIN,
      }),
    )
  })

  // O nome é opcional: mandar string vazia gravaria um membro chamado "".
  it("omite o nome quando o campo fica vazio", async () => {
    await abrirConvite()

    await userEvent.type(screen.getByLabelText("E-mail"), "novo@alfa.com")
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }))

    await waitFor(() =>
      expect(convidar).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: undefined }),
      ),
    )
  })

  it("fecha e limpa o formulário depois de convidar", async () => {
    await abrirConvite()
    await userEvent.type(screen.getByLabelText("E-mail"), "novo@alfa.com")

    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }))

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Convidar para a conta" }),
      ).not.toBeInTheDocument(),
    )
  })
})
