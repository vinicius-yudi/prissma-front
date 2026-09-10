import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import type { BudgetItem, ProjectBudget } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  deleteBudget,
  deleteBudgetItem,
  deleteExpense,
  getProjectBudget,
  listExpenses,
} from "../../services/budget.service"
import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { listStages } from "../../services/stages.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { OrcamentoTab } from "../OrcamentoTab"

vi.mock("../../services/budget.service", () => ({
  getProjectBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  updateBudgetItem: vi.fn(),
  deleteBudgetItem: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  listExpenses: vi.fn(),
}))
vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
}))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const buscar = vi.mocked(getProjectBudget)
const excluirOrcamento = vi.mocked(deleteBudget)
const excluirItem = vi.mocked(deleteBudgetItem)
const excluirDespesa = vi.mocked(deleteExpense)
const listarDespesas = vi.mocked(listExpenses)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function categoria(over: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 3,
    projectBudgetId: 5,
    category: "Fundação",
    description: "Concreto",
    plannedAmount: 40_000,
    totalSpent: 10_000,
    remaining: 30_000,
    exceeded: false,
    ...over,
  }
}

function orcamento(over: Partial<ProjectBudget> = {}): ProjectBudget {
  return {
    id: 5,
    constructionProjectId: 7,
    description: "Orçamento base",
    plannedTotal: 100_000,
    totalSpent: 25_000,
    remaining: 75_000,
    exceeded: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    items: [categoria()],
    ...over,
  }
}

function membro(): ConstructionProjectMember {
  return {
    id: 10,
    constructionProjectId: 7,
    user: EU,
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

function render() {
  return renderWithProviders(<OrcamentoTab projectId={7} />)
}

/**
 * O cabeçalho do orçamento e cada categoria têm um menu com o mesmo rótulo;
 * o card carrega o id que o banner de estouro usa como âncora, e é por ele que
 * se chega ao menu certo.
 */
function menuDaCategoria(id = 3) {
  return within(document.getElementById(`budget-category-${id}`) as HTMLElement).getByLabelText(
    "menu",
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue(orcamento())
  vi.mocked(listStages).mockResolvedValue([])
  listarDespesas.mockResolvedValue([])
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_BUDGET],
  })
  excluirOrcamento.mockResolvedValue(undefined)
  excluirItem.mockResolvedValue(undefined)
  excluirDespesa.mockResolvedValue(undefined)
})

describe("<OrcamentoTab /> — estados", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    buscar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("oferece recarregar quando a consulta falha", async () => {
    buscar.mockRejectedValue(new Error("Erro 500"))

    render()

    await screen.findByText(/Não foi possível carregar/)
    buscar.mockClear()
    await userEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }))
    await waitFor(() => expect(buscar).toHaveBeenCalled())
  })

  // Obra sem orçamento não tem painel nem gráfico: só o convite para criar.
  it("convida a criar quando a obra não tem orçamento", async () => {
    buscar.mockResolvedValue(null)

    render()

    expect(await screen.findByText("Nenhum orçamento criado")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Orçamento" })).not.toBeInTheDocument()
  })

  it("abre o formulário de criação a partir do estado vazio", async () => {
    buscar.mockResolvedValue(null)
    render()
    await screen.findByText("Nenhum orçamento criado")

    await userEvent.click(screen.getByRole("button", { name: "Criar orçamento" }))

    expect(await screen.findByRole("heading", { name: "Criar orçamento" })).toBeInTheDocument()
  })

  it("monta painel, gráficos e lista quando há orçamento", async () => {
    render()

    expect(await screen.findByRole("heading", { name: "Orçamento" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
  })
})

describe("<OrcamentoTab /> — categorias e despesas", () => {
  it("abre o formulário de categoria pelo botão do painel", async () => {
    render()
    await screen.findByRole("heading", { name: "Orçamento" })

    await userEvent.click(screen.getByRole("button", { name: "Nova categoria" }))

    expect(await screen.findByRole("heading", { name: "Nova categoria" })).toBeInTheDocument()
  })

  it("abre a categoria e carrega as despesas dela", async () => {
    render()
    await screen.findByRole("heading", { name: "Fundação" })

    await userEvent.click(screen.getByRole("button", { name: "Expandir" }))

    await waitFor(() => expect(listarDespesas).toHaveBeenCalledWith(3))
  })

  it("abre o formulário da categoria escolhida para editar", async () => {
    render()
    await screen.findByRole("heading", { name: "Fundação" })

    await userEvent.click(menuDaCategoria())
    await userEvent.click(screen.getByText("Editar categoria"))

    expect(await screen.findByDisplayValue("Fundação")).toBeInTheDocument()
  })
})

/**
 * Um modal só para as três exclusões — orçamento, categoria e despesa. O alvo
 * decide qual endpoint é chamado.
 */
describe("<OrcamentoTab /> — exclusões", () => {
  it("exclui a categoria pelo menu dela", async () => {
    render()
    await screen.findByRole("heading", { name: "Fundação" })
    await userEvent.click(menuDaCategoria())
    await userEvent.click(screen.getByText("Excluir categoria"))

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluirItem).toHaveBeenCalledWith(3))
    expect(excluirOrcamento).not.toHaveBeenCalled()
  })

  it("desiste sem excluir no cancelar", async () => {
    render()
    await screen.findByRole("heading", { name: "Fundação" })
    await userEvent.click(menuDaCategoria())
    await userEvent.click(screen.getByText("Excluir categoria"))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(excluirItem).not.toHaveBeenCalled()
  })
})

/**
 * Estouro é condição, não evento: o banner fica na tela e leva à categoria —
 * abrindo-a e rolando até ela, porque numa lista longa ela está fora da vista.
 */
describe("<OrcamentoTab /> — banner de estouro", () => {
  it("não aparece com o orçamento em dia", async () => {
    render()

    await screen.findByRole("heading", { name: "Orçamento" })
    expect(screen.queryByRole("button", { name: /Revisar|↗/ })).not.toBeInTheDocument()
  })

  it("abre a categoria estourada ao revisar", async () => {
    buscar.mockResolvedValue(
      orcamento({ items: [categoria({ exceeded: true, totalSpent: 90_000 })] }),
    )
    render()
    await screen.findByRole("heading", { name: "Fundação" })

    await userEvent.click(screen.getByRole("button", { name: /↗/ }))

    await waitFor(() => expect(listarDespesas).toHaveBeenCalledWith(3))
  })
})

describe("<OrcamentoTab /> — permissão", () => {
  it("esconde as ações de quem não gerencia o orçamento", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    render()

    await screen.findByRole("heading", { name: "Orçamento" })
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Nova categoria" })).not.toBeInTheDocument(),
    )
    expect(screen.queryByLabelText("menu")).not.toBeInTheDocument()
  })

  it("esconde o botão de criar no estado vazio para quem não pode", async () => {
    buscar.mockResolvedValue(null)
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    render()

    await screen.findByText("Nenhum orçamento criado")
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Criar orçamento" })).not.toBeInTheDocument(),
    )
  })
})
