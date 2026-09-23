import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { createHookWrapper } from "@/test/renderWithProviders"
import type { BudgetItem, Expense, ProjectBudget } from "@/shared/types/budget"

import {
  createBudget,
  createBudgetItem,
  createExpense,
  deleteBudget,
  deleteBudgetItem,
  deleteExpense,
  getProjectBudget,
  updateBudget,
  updateBudgetItem,
  updateExpense,
} from "../../services/budget.service"
import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { useBudget } from "../useBudget"

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
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({ getEquipeMembers: vi.fn() }))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const buscar = vi.mocked(getProjectBudget)
const criarOrcamento = vi.mocked(createBudget)
const editarOrcamento = vi.mocked(updateBudget)
const excluirOrcamento = vi.mocked(deleteBudget)
const criarItem = vi.mocked(createBudgetItem)
const editarItem = vi.mocked(updateBudgetItem)
const excluirItem = vi.mocked(deleteBudgetItem)
const criarDespesa = vi.mocked(createExpense)
const editarDespesa = vi.mocked(updateExpense)
const excluirDespesa = vi.mocked(deleteExpense)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

const ORCAMENTO: ProjectBudget = {
  id: 5,
  constructionProjectId: 7,
  description: "Orçamento base",
  plannedTotal: 100_000,
  totalSpent: 25_000,
  remaining: 75_000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [],
}

const CATEGORIA: BudgetItem = {
  id: 3,
  projectBudgetId: 5,
  category: "Fundação",
  description: "Concreto e ferragem",
  plannedAmount: 40_000,
  totalSpent: 10_000,
  remaining: 30_000,
  exceeded: false,
}

function despesa(over: Partial<Expense> = {}): Expense {
  return {
    id: 11,
    budgetItemId: 3,
    stageId: null,
    description: "Cimento",
    amount: 500,
    supplier: null,
    receiptUrl: null,
    spentAt: "2026-02-01",
    createdAt: "2026-02-01T00:00:00Z",
    categoryExceeded: false,
    budgetExceeded: false,
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

function render(projectId = 7) {
  return renderHook(() => useBudget(projectId), { wrapper: createHookWrapper() })
}

/** Monta e espera o orçamento chegar, para não asserir em cima do loading. */
async function renderCarregado() {
  const view = render()
  await waitFor(() => expect(view.result.current.budget).not.toBeNull())
  return view
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue(ORCAMENTO)
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_BUDGET],
  })
  criarOrcamento.mockResolvedValue(ORCAMENTO)
  editarOrcamento.mockResolvedValue(ORCAMENTO)
  excluirOrcamento.mockResolvedValue(undefined)
  criarItem.mockResolvedValue(CATEGORIA)
  editarItem.mockResolvedValue(CATEGORIA)
  excluirItem.mockResolvedValue(undefined)
  criarDespesa.mockResolvedValue(despesa())
  editarDespesa.mockResolvedValue(despesa())
  excluirDespesa.mockResolvedValue(undefined)
})

describe("useBudget — consulta", () => {
  it("não consulta com obra inválida", () => {
    render(0)

    expect(buscar).not.toHaveBeenCalled()
  })

  // A tela distingue "ainda carregando" de "obra sem orçamento", e só o
  // segundo mostra o estado vazio com o botão de criar.
  it("devolve null enquanto carrega", () => {
    const { result } = render()

    expect(result.current.budget).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve o orçamento da obra", async () => {
    const { result } = await renderCarregado()

    expect(buscar).toHaveBeenCalledWith(7)
    expect(result.current.budget?.plannedTotal).toBe(100_000)
  })

  it("sinaliza erro da consulta", async () => {
    buscar.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("libera a edição para quem tem MANAGE_BUDGET", async () => {
    const { result } = await renderCarregado()

    await waitFor(() => expect(result.current.canMutate).toBe(true))
  })

  it("bloqueia a edição para quem não tem a permissão", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    const { result } = await renderCarregado()

    await waitFor(() => expect(result.current.canMutate).toBe(false))
  })
})

describe("useBudget — orçamento", () => {
  it("cria o orçamento dentro da obra", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createBudget({ plannedTotal: 100_000 })
    })

    expect(criarOrcamento).toHaveBeenCalledWith(7, { plannedTotal: 100_000 })
    expect(toast.success).toHaveBeenCalled()
  })

  /**
   * A obra tem no máximo um orçamento. Se dois usuários clicam em "criar" ao
   * mesmo tempo, o segundo recebe 409 — e a resposta certa é recarregar, não
   * repetir o erro do backend em inglês.
   */
  it("recarrega e traduz o conflito quando o orçamento já existe", async () => {
    criarOrcamento.mockRejectedValue(new Error("Budget already exists for this project"))
    const { result } = await renderCarregado()
    buscar.mockClear()

    await act(async () => {
      await result.current.createBudget({ plannedTotal: 1 }).catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith(expect.not.stringContaining("already"))
    await waitFor(() => expect(buscar).toHaveBeenCalled())
  })

  it("mostra a mensagem do backend em outros erros de criação", async () => {
    criarOrcamento.mockRejectedValue(new Error("Valor planejado inválido."))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createBudget({ plannedTotal: -1 }).catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith("Valor planejado inválido.")
  })

  it("edita pela rota do próprio orçamento", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.updateBudget({ id: 5, payload: { plannedTotal: 120_000 } })
    })

    expect(editarOrcamento).toHaveBeenCalledWith(5, { plannedTotal: 120_000 })
    expect(toast.success).toHaveBeenCalled()
  })

  it("avisa quando a edição do orçamento falha", async () => {
    editarOrcamento.mockRejectedValue(new Error("Orçamento travado."))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.updateBudget({ id: 5, payload: {} }).catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith("Orçamento travado.")
  })

  it("exclui o orçamento", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.deleteBudget(5)
    })

    expect(excluirOrcamento).toHaveBeenCalledWith(5)
    expect(toast.success).toHaveBeenCalled()
  })

  it("avisa quando a exclusão do orçamento falha", async () => {
    excluirOrcamento.mockRejectedValue(new Error("Há despesas lançadas."))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.deleteBudget(5).catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith("Há despesas lançadas.")
  })
})

describe("useBudget — categorias", () => {
  it("cria a categoria dentro do orçamento", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createItem({ budgetId: 5, payload: { category: "Fundação" } })
    })

    expect(criarItem).toHaveBeenCalledWith(5, { category: "Fundação" })
    expect(toast.success).toHaveBeenCalled()
  })

  it("edita a categoria pela rota dela", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.updateItem({ id: 3, payload: { plannedAmount: 900 } })
    })

    expect(editarItem).toHaveBeenCalledWith(3, { plannedAmount: 900 })
  })

  it("exclui a categoria", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.deleteItem(3)
    })

    expect(excluirItem).toHaveBeenCalledWith(3)
  })

  it.each([
    ["criação", () => criarItem.mockRejectedValue(new Error("Categoria repetida."))],
    ["edição", () => editarItem.mockRejectedValue(new Error("Categoria repetida."))],
    ["exclusão", () => excluirItem.mockRejectedValue(new Error("Categoria repetida."))],
  ])("avisa quando a %s da categoria falha", async (caso, prepara) => {
    prepara()
    const { result } = await renderCarregado()

    await act(async () => {
      if (caso === "criação") {
        await result.current.createItem({ budgetId: 5, payload: {} }).catch(() => {})
      } else if (caso === "edição") {
        await result.current.updateItem({ id: 3, payload: {} }).catch(() => {})
      } else {
        await result.current.deleteItem(3).catch(() => {})
      }
    })

    expect(toast.error).toHaveBeenCalledWith("Categoria repetida.")
  })
})

describe("useBudget — despesas", () => {
  it("lança a despesa dentro da categoria", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createExpense({ itemId: 3, payload: { amount: 500 } })
    })

    expect(criarDespesa).toHaveBeenCalledWith(3, { amount: 500 })
    expect(toast.success).toHaveBeenCalled()
  })

  /**
   * Estourar o teto não é erro — o backend grava a despesa e devolve as flags.
   * O aviso existe porque o número que estourou fica longe do formulário e
   * passaria despercebido.
   */
  it("avisa quando a despesa estoura a categoria", async () => {
    criarDespesa.mockResolvedValue(despesa({ categoryExceeded: true }))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createExpense({ itemId: 3, payload: { amount: 99_999 } })
    })

    expect(toast.warning).toHaveBeenCalledTimes(1)
  })

  it("avisa dos dois tetos quando a despesa estoura categoria e orçamento", async () => {
    criarDespesa.mockResolvedValue(despesa({ categoryExceeded: true, budgetExceeded: true }))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createExpense({ itemId: 3, payload: { amount: 999_999 } })
    })

    expect(toast.warning).toHaveBeenCalledTimes(2)
  })

  it("não avisa de teto quando a despesa cabe", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.createExpense({ itemId: 3, payload: { amount: 10 } })
    })

    expect(toast.warning).not.toHaveBeenCalled()
  })

  it("edita a despesa e reavalia o teto", async () => {
    editarDespesa.mockResolvedValue(despesa({ budgetExceeded: true }))
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.updateExpense({ id: 11, payload: { amount: 200_000 } })
    })

    expect(editarDespesa).toHaveBeenCalledWith(11, { amount: 200_000 })
    expect(toast.warning).toHaveBeenCalledTimes(1)
  })

  it("exclui a despesa", async () => {
    const { result } = await renderCarregado()

    await act(async () => {
      await result.current.deleteExpense(11)
    })

    expect(excluirDespesa).toHaveBeenCalledWith(11)
    expect(toast.success).toHaveBeenCalled()
  })

  it.each([
    ["lançamento", () => criarDespesa.mockRejectedValue(new Error("Data futura."))],
    ["edição", () => editarDespesa.mockRejectedValue(new Error("Data futura."))],
    ["exclusão", () => excluirDespesa.mockRejectedValue(new Error("Data futura."))],
  ])("avisa quando o %s da despesa falha", async (caso, prepara) => {
    prepara()
    const { result } = await renderCarregado()

    await act(async () => {
      if (caso === "lançamento") {
        await result.current.createExpense({ itemId: 3, payload: {} }).catch(() => {})
      } else if (caso === "edição") {
        await result.current.updateExpense({ id: 11, payload: {} }).catch(() => {})
      } else {
        await result.current.deleteExpense(11).catch(() => {})
      }
    })

    expect(toast.error).toHaveBeenCalledWith("Data futura.")
  })
})

// A barra de ações inteira desabilita durante qualquer gravação, senão dois
// cliques seguidos lançam a mesma despesa duas vezes.
describe("useBudget — isMutating", () => {
  it("fica ligado enquanto uma gravação está em voo", async () => {
    let liberar = () => {}
    criarDespesa.mockImplementation(
      () => new Promise((resolve) => { liberar = () => resolve(despesa()) }),
    )
    const { result } = await renderCarregado()

    act(() => {
      void result.current.createExpense({ itemId: 3, payload: { amount: 1 } })
    })

    await waitFor(() => expect(result.current.isMutating).toBe(true))

    await act(async () => { liberar() })

    await waitFor(() => expect(result.current.isMutating).toBe(false))
  })
})
