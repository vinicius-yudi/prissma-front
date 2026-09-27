import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getProjectAcompanhamento } from "@/pages/projetos/services/projects.service"
import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import type { BudgetItem, Expense, ProjectBudget } from "@/shared/types/budget"
import { ProjectStatus } from "@/shared/types/project"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  createBudget,
  createBudgetItem,
  createExpense,
  deleteBudget,
  deleteBudgetItem,
  deleteExpense,
  getProjectBudget,
  listBudgetExpenses,
  updateBudgetItem,
  updateExpense,
} from "../../services/budget.service"
import { getEquipeMembers } from "../../services/equipes.service"
import { ProjectPermission, ProjectRole, getRolePermissions } from "../../services/projectPermissions.service"
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
  listBudgetExpenses: vi.fn(),
}))
vi.mock("../../services/stages.service", () => ({ listStages: vi.fn() }))
vi.mock("@/pages/projetos/services/projects.service", () => ({ getProjectAcompanhamento: vi.fn() }))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({ getEquipeMembers: vi.fn() }))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const buscar = vi.mocked(getProjectBudget)
const despesas = vi.mocked(listBudgetExpenses)
const acompanhamento = vi.mocked(getProjectAcompanhamento)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }
const OBRA = { id: 7, status: ProjectStatus.IN_PROGRESS, plannedStartDate: "2026-01-01", plannedEndDate: "2026-12-31" }

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
    description: null,
    plannedTotal: 100_000,
    totalSpent: 25_000,
    remaining: 75_000,
    exceeded: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    items: [categoria(), categoria({ id: 4, category: "Alvenaria", plannedAmount: 20_000, totalSpent: 15_000 })],
    ...over,
  }
}

function despesa(id: number, over: Partial<Expense> = {}): Expense {
  return {
    id,
    budgetItemId: 3,
    stageId: null,
    description: `Despesa ${id}`,
    amount: 1_000,
    supplier: null,
    receiptUrl: null,
    spentAt: "2026-03-10",
    createdAt: "2026-03-10T00:00:00Z",
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

function render(obra = OBRA, route = "/") {
  return renderWithProviders(<OrcamentoTab project={obra} />, { route })
}

async function renderCarregado(route?: string) {
  const view = render(OBRA, route)
  await screen.findByText("Curva de gastos")
  return view
}

/** Etapa com metade das tarefas concluídas: avanço físico de 50%. */
function avanco(done: number, total: number) {
  acompanhamento.mockResolvedValue({
    obraId: 7,
    titulo: "Obra",
    status: ProjectStatus.IN_PROGRESS,
    totalEtapas: 1,
    etapasConcluidas: 0,
    totalTarefas: total,
    tarefasConcluidas: done,
    stageStatusCounts: {},
    taskStatusCounts: { DONE: done, TODO: total - done },
    etapas: [
      {
        id: 1,
        name: "Fundação",
        description: null,
        displayOrder: 1,
        status: EtapaStatus.IN_PROGRESS,
        plannedStartDate: "2026-01-01",
        plannedEndDate: "2026-12-31",
        totalTarefas: total,
        taskStatusCounts: { DONE: done, TODO: total - done },
      },
    ],
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue(orcamento())
  despesas.mockResolvedValue([despesa(1), despesa(2, { budgetItemId: 4, spentAt: "2026-04-01", supplier: "Depósito" })])
  vi.mocked(listStages).mockResolvedValue([])
  avanco(1, 2)
  vi.mocked(getMyProfile).mockResolvedValue(EU)
  vi.mocked(getEquipeMembers).mockResolvedValue([membro()])
  permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [ProjectPermission.MANAGE_BUDGET] })
  vi.mocked(createExpense).mockResolvedValue(despesa(9))
  vi.mocked(updateExpense).mockResolvedValue(despesa(1))
  vi.mocked(createBudgetItem).mockResolvedValue(categoria({ id: 8 }))
  vi.mocked(updateBudgetItem).mockResolvedValue(categoria())
  vi.mocked(createBudget).mockResolvedValue(orcamento())
  vi.mocked(deleteBudget).mockResolvedValue(undefined)
  vi.mocked(deleteBudgetItem).mockResolvedValue(undefined)
  vi.mocked(deleteExpense).mockResolvedValue(undefined)
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
    await screen.findByText("Não foi possível carregar o orçamento.")
    buscar.mockClear()
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))
    await waitFor(() => expect(buscar).toHaveBeenCalled())
  })

  it("sem orçamento, cria pelo estado vazio", async () => {
    buscar.mockResolvedValue(null)
    render()

    await userEvent.click(await screen.findByRole("button", { name: /Criar orçamento/ }))
    const dialog = within(await screen.findByRole("dialog"))
    await userEvent.type(dialog.getByLabelText("Valor orçado total (R$)"), "250.000,00")
    await userEvent.click(dialog.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(createBudget).toHaveBeenCalledWith(7, { description: null, plannedTotal: 250_000 }))
  })

  it("sem orçamento e sem permissão, só avisa", async () => {
    buscar.mockResolvedValue(null)
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
    render()
    await screen.findByText("Nenhum orçamento criado")
    await waitFor(() => expect(screen.queryByRole("button", { name: /Criar orçamento/ })).not.toBeInTheDocument())
  })

  it("sem categorias, convida a criar a primeira", async () => {
    buscar.mockResolvedValue(orcamento({ items: [] }))
    despesas.mockResolvedValue([])
    await renderCarregado()
    expect(screen.getByText("Nenhuma categoria ainda")).toBeInTheDocument()
    expect(await screen.findByText("Nenhum lançamento")).toBeInTheDocument()
  })

  it("sem datas da obra, explica por que a curva não aparece", async () => {
    render({ ...OBRA, plannedStartDate: "", plannedEndDate: "" })
    expect(await screen.findByText(/Defina início e término planejados/)).toBeInTheDocument()
  })
})

describe("<OrcamentoTab /> — números", () => {
  it("mostra orçado, saldo e a projeção pelo avanço físico", async () => {
    avanco(1, 4)
    await renderCarregado()

    expect(screen.getByText("2 categorias")).toBeInTheDocument()
    expect(screen.getByText("75% ainda disponível")).toBeInTheDocument()
    // 25 mil gastos com 25% de avanço projetam 100 mil: dentro do orçado.
    expect(await screen.findByText(/Dentro do orçado/)).toBeInTheDocument()
  })

  it("projeta estouro em perigo", async () => {
    // 25 mil com 20% de avanço projetam 125 mil.
    avanco(1, 5)
    await renderCarregado()
    expect(await screen.findByText(/25% acima do orçado/)).toBeInTheDocument()
  })

  it("sem avanço suficiente, não projeta", async () => {
    avanco(0, 4)
    await renderCarregado()
    expect(screen.getByText(/Disponível com a obra em andamento/)).toBeInTheDocument()
  })

  it("marca a categoria estourada com quanto passou", async () => {
    buscar.mockResolvedValue(orcamento({ items: [categoria({ totalSpent: 45_000, exceeded: true })] }))
    await renderCarregado()
    expect(screen.getByText("1 acima")).toBeInTheDocument()
    expect(screen.getByText("+R$ 5.000,00 além do planejado")).toBeInTheDocument()
  })

  it("lê planejado e gasto ao passar o ponteiro na curva", async () => {
    await renderCarregado()
    const svg = screen.getByRole("img", { name: /Gasto acumulado comparado/ })
    svg.getBoundingClientRect = () => ({ left: 0, width: 640, top: 0, height: 220 }) as DOMRect
    // O jsdom não tem PointerEvent: um MouseEvent com o tipo certo carrega o clientX.
    act(() => {
      svg.dispatchEvent(new MouseEvent("pointermove", { clientX: 300, bubbles: true }))
    })
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Planejado")
    fireEvent.pointerLeave(svg)
  })
})

describe("<OrcamentoTab /> — lançamentos", () => {
  it("lista do mais recente ao mais antigo e filtra pela categoria (na URL)", async () => {
    await renderCarregado()
    const linhas = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[1].textContent)
    await waitFor(() => expect(linhas()).toEqual(["Despesa 2", "Despesa 1"]))

    await userEvent.click(screen.getByRole("button", { name: /^Fundação/ }))
    expect(linhas()).toEqual(["Despesa 1"])
    await userEvent.click(screen.getByRole("button", { name: "Mostrar todas as categorias" }))
    expect(linhas()).toHaveLength(2)
  })

  it("lança despesa com prévia e avisa quando vai estourar", async () => {
    await renderCarregado("/?categoria=4")
    await userEvent.click(screen.getByRole("button", { name: /Lançar despesa/ }))
    const dialog = within(await screen.findByRole("dialog"))

    expect(dialog.getByLabelText("Categoria")).toHaveValue("4")
    await userEvent.type(dialog.getByLabelText("Valor"), "8.000,00")
    expect(dialog.getByText("Ultrapassa o planejado em R$ 3.000,00.")).toBeInTheDocument()
    await userEvent.type(dialog.getByLabelText("Descrição"), "Blocos cerâmicos")

    await userEvent.click(dialog.getByRole("button", { name: "Lançar mesmo assim" }))
    await waitFor(() => expect(createExpense).toHaveBeenCalled())
    expect(vi.mocked(createExpense).mock.calls[0][0]).toBe(4)
    expect(vi.mocked(createExpense).mock.calls[0][1]).toMatchObject({ amount: 8000, description: "Blocos cerâmicos" })
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("mostra o erro no campo e não lança sem valor", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: /Lançar despesa/ }))
    const dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByText(/Restará/)).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: "Lançar despesa" }))
    expect(await dialog.findByText("Informe um valor maior que zero.")).toBeInTheDocument()
    expect(createExpense).not.toHaveBeenCalled()
  })

  it("edita despesa sem trocar a categoria", async () => {
    await renderCarregado()
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Editar despesa" })).toHaveLength(2))
    await userEvent.click(screen.getAllByRole("button", { name: "Editar despesa" })[1])
    const dialog = within(await screen.findByRole("dialog"))

    expect(dialog.getByLabelText("Categoria")).toBeDisabled()
    await userEvent.click(dialog.getByRole("button", { name: "Lançar despesa" }))
    await waitFor(() => expect(updateExpense).toHaveBeenCalledWith(1, expect.objectContaining({ amount: 1000 })))
  })

  it("exclui despesa depois de confirmar", async () => {
    await renderCarregado()
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Excluir despesa" })).toHaveLength(2))
    await userEvent.click(screen.getAllByRole("button", { name: "Excluir despesa" })[0])
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Excluir" }))
    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith(2))
  })
})

describe("<OrcamentoTab /> — categorias e orçamento", () => {
  it("cria e edita categoria", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: /Nova categoria/ }))
    let dialog = within(await screen.findByRole("dialog"))
    await userEvent.type(dialog.getByLabelText("Categoria"), "Cobertura")
    await userEvent.type(dialog.getByLabelText("Valor planejado (R$)"), "12000")
    await userEvent.type(dialog.getByLabelText("Descrição"), "Telhas e estrutura")
    await userEvent.click(dialog.getByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(createBudgetItem).toHaveBeenCalledWith(5, { category: "Cobertura", description: "Telhas e estrutura", plannedAmount: 12000 }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole("button", { name: "Ações de Fundação" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Editar categoria" }))
    dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByLabelText("Categoria")).toHaveValue("Fundação")
    await userEvent.click(dialog.getByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(updateBudgetItem).toHaveBeenCalledWith(3, expect.objectContaining({ category: "Fundação" })))
  })

  it("exclui categoria e orçamento pelos menus", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Ações de Alvenaria" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Excluir categoria" }))
    expect(screen.getByText(/Excluir "Alvenaria" remove também/)).toBeInTheDocument()
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }))
    await waitFor(() => expect(deleteBudgetItem).toHaveBeenCalledWith(4))

    await userEvent.click(screen.getByRole("button", { name: "Ações do orçamento" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Excluir orçamento" }))
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }))
    expect(deleteBudget).not.toHaveBeenCalled()
  })

  it("mantém o modal aberto quando o servidor recusa", async () => {
    vi.mocked(createBudgetItem).mockRejectedValue(new Error("Nome repetido."))
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: /Nova categoria/ }))
    const dialog = within(await screen.findByRole("dialog"))
    await userEvent.type(dialog.getByLabelText("Categoria"), "Fundação")
    await userEvent.type(dialog.getByLabelText("Valor planejado (R$)"), "1")
    await userEvent.type(dialog.getByLabelText("Descrição"), "x")
    await userEvent.click(dialog.getByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nome repetido."))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("esconde as ações de quem não gerencia o orçamento", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
    await renderCarregado()
    await waitFor(() => expect(screen.queryByRole("button", { name: /Nova categoria/ })).not.toBeInTheDocument())
    expect(screen.queryByRole("button", { name: "Ações de Fundação" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir despesa" })).not.toBeInTheDocument()
  })
})
