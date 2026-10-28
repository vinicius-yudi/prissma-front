import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyTasks, type MyTask } from "@/pages/dashboard/services/myTasks.service"
import type { ProjectBudget } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listBudgetExpenses } from "../../../services/budget.service"
import { listProposals } from "../../../services/propostas.service"
import { getSchedule } from "../../../services/schedule.service"
import type { Proposal, ProposalPage } from "../../../types/proposal"
import type { TeamSchedule } from "../../../types/schedule"
import { MyTasksWidget } from "../widgets/MyTasksWidget"
import { ProposalsWidget } from "../widgets/ProposalsWidget"
import { RecentExpensesWidget } from "../widgets/RecentExpensesWidget"
import { WeekScheduleWidget } from "../widgets/WeekScheduleWidget"

vi.mock("@/pages/dashboard/services/myTasks.service", () => ({ getMyTasks: vi.fn() }))
vi.mock("../../../services/propostas.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../services/propostas.service")>()),
  listProposals: vi.fn(),
}))
vi.mock("../../../services/schedule.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../services/schedule.service")>()),
  getSchedule: vi.fn(),
}))
vi.mock("../../../services/budget.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../services/budget.service")>()),
  listBudgetExpenses: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function task(overrides: Partial<MyTask>): MyTask {
  return {
    id: 1,
    projectId: 7,
    stageId: 1,
    stageName: "Alvenaria",
    title: "Tarefa",
    priority: "MEDIUM",
    status: "TODO",
    plannedStartDate: null,
    plannedEndDate: null,
    ...overrides,
  }
}

describe("MyTasksWidget", () => {
  it("lista só as tarefas abertas desta obra, as que vencem antes primeiro", async () => {
    vi.mocked(getMyTasks).mockResolvedValue([
      task({ id: 1, title: "Vence depois", plannedEndDate: "2026-07-10" }),
      task({ id: 2, title: "De outra obra", projectId: 99 }),
      task({ id: 3, title: "Já concluída", status: "DONE" }),
      task({ id: 4, title: "Vence antes", plannedEndDate: "2026-06-20" }),
    ])

    renderWithProviders(<MyTasksWidget projectId={7} />)

    const titles = (await screen.findAllByText(/^Vence/)).map((el) => el.textContent)
    expect(titles).toEqual(["Vence antes", "Vence depois"])
    expect(screen.queryByText("De outra obra")).not.toBeInTheDocument()
    expect(screen.queryByText("Já concluída")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver tarefas" })).toHaveAttribute("href", "/obras/7/tarefas")
  })

  it("diz quando não há tarefa sua em aberto", async () => {
    vi.mocked(getMyTasks).mockResolvedValue([task({ projectId: 99 })])

    renderWithProviders(<MyTasksWidget projectId={7} />)

    expect(await screen.findByText("Nenhuma tarefa sua em aberto nesta obra.")).toBeInTheDocument()
  })

  it("avisa quando não consegue carregar", async () => {
    vi.mocked(getMyTasks).mockRejectedValue(new Error("falhou"))

    renderWithProviders(<MyTasksWidget projectId={7} />)

    expect(await screen.findByText("Não foi possível carregar.")).toBeInTheDocument()
  })
})

function proposal(id: number, title: string, status: string | null): Proposal {
  return {
    id,
    constructionProjectId: 7,
    stageId: null,
    title,
    description: null,
    environmentType: "KITCHEN",
    createdByUserId: 1,
    createdByName: "Rafael",
    latestVersion: status
      ? {
          id: id * 10,
          version: 2,
          status,
          description: null,
          authorUserId: 1,
          authorName: "Beatriz",
          generatedByAi: false,
          hasImage: false,
          fileName: null,
          fileType: null,
          submittedAt: "2026-06-10T10:00:00Z",
          updatedAt: "2026-06-10T10:00:00Z",
        }
      : null,
    versionCount: status ? 2 : 0,
    versions: null,
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-10T10:00:00Z",
  } as Proposal
}

function page(content: Proposal[]): ProposalPage {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true }
}

describe("ProposalsWidget", () => {
  it("mostra só as propostas cuja versão mais recente aguarda aprovação", async () => {
    vi.mocked(listProposals).mockResolvedValue(
      page([
        proposal(1, "Cozinha gourmet", "PENDING_REVIEW"),
        proposal(2, "Sala", "APPROVED"),
        proposal(3, "Suíte", null),
      ]),
    )

    renderWithProviders(<ProposalsWidget projectId={7} />)

    expect(await screen.findByText("Cozinha gourmet")).toBeInTheDocument()
    expect(screen.getByText(/v2 · Beatriz/)).toBeInTheDocument()
    expect(screen.queryByText("Sala")).not.toBeInTheDocument()
    expect(screen.queryByText("Suíte")).not.toBeInTheDocument()
  })

  it("diz quando nada aguarda aprovação", async () => {
    vi.mocked(listProposals).mockResolvedValue(page([proposal(2, "Sala", "APPROVED")]))

    renderWithProviders(<ProposalsWidget projectId={7} />)

    expect(await screen.findByText("Nenhuma proposta aguardando aprovação.")).toBeInTheDocument()
  })
})

const SCHEDULE: TeamSchedule = {
  constructionProjectId: 7,
  view: "WEEK",
  startDate: "2026-06-15",
  endDate: "2026-06-16",
  previousDate: "2026-06-08",
  nextDate: "2026-06-22",
  days: ["2026-06-15", "2026-06-16"],
  members: [
    {
      userId: 1,
      userName: "João Pereira",
      roleInProject: "FOREMAN",
      userResponsibility: null,
      totalAllocatedHours: 12,
      hasOverlap: true,
      days: [
        { date: "2026-06-15", allocatedHours: 8, allocated: true, overlapped: false, tasks: [] },
        { date: "2026-06-16", allocatedHours: 4, allocated: true, overlapped: true, tasks: [] },
      ],
    },
    {
      userId: 2,
      userName: "Lucas Ferreira",
      roleInProject: "FOREMAN",
      userResponsibility: null,
      totalAllocatedHours: 0,
      hasOverlap: false,
      days: [
        { date: "2026-06-15", allocatedHours: 0, allocated: false, overlapped: false, tasks: [] },
        { date: "2026-06-16", allocatedHours: 0, allocated: false, overlapped: false, tasks: [] },
      ],
    },
  ],
} as TeamSchedule

describe("WeekScheduleWidget", () => {
  it("mostra as horas de cada integrante por dia e destaca a sobreposição", async () => {
    vi.mocked(getSchedule).mockResolvedValue(SCHEDULE)

    renderWithProviders(<WeekScheduleWidget projectId={7} />)

    const joao = (await screen.findByRole("rowheader", { name: "João Pereira" })).closest("tr") as HTMLElement
    const cells = Array.from(joao.querySelectorAll("td")).map((td) => td.textContent)
    expect(cells).toEqual(["8h", "4h"])
    expect(joao.querySelectorAll("td")[1]).toHaveClass("text-danger")

    const lucas = screen.getByRole("rowheader", { name: "Lucas Ferreira" }).closest("tr") as HTMLElement
    expect(Array.from(lucas.querySelectorAll("td")).map((td) => td.textContent)).toEqual(["—", "—"])
    expect(vi.mocked(getSchedule)).toHaveBeenCalledWith(7, { view: "WEEK" })
  })

  it("diz quando ninguém está alocado", async () => {
    vi.mocked(getSchedule).mockResolvedValue({ ...SCHEDULE, members: [] })

    renderWithProviders(<WeekScheduleWidget projectId={7} />)

    expect(await screen.findByText("Ninguém alocado nesta semana.")).toBeInTheDocument()
  })
})

const BUDGET = {
  id: 3,
  constructionProjectId: 7,
  description: null,
  plannedTotal: 100000,
  totalSpent: 0,
  remaining: 100000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [
    { id: 11, projectBudgetId: 3, category: "Materiais", description: "", plannedAmount: 1, totalSpent: 0, remaining: 0, exceeded: false },
  ],
} as ProjectBudget

function expense(id: number, description: string, spentAt: string, amount: number) {
  return {
    id,
    budgetItemId: 11,
    stageId: null,
    description,
    amount,
    supplier: null,
    receiptUrl: null,
    spentAt,
    createdAt: `${spentAt}T10:00:00Z`,
    categoryExceeded: false,
    budgetExceeded: false,
  }
}

describe("RecentExpensesWidget", () => {
  it("lista as despesas mais recentes primeiro, com categoria e valor", async () => {
    vi.mocked(listBudgetExpenses).mockResolvedValue([
      expense(1, "Cimento", "2026-06-01", 1200),
      expense(2, "Aço CA-50", "2026-06-12", 8400.5),
    ])

    renderWithProviders(<RecentExpensesWidget projectId={7} budget={BUDGET} />)

    const first = await screen.findByText("Aço CA-50")
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toContainElement(first)
    expect(items[0]).toHaveTextContent(/Materiais/)
    expect(items[0]).toHaveTextContent(/R\$\s?8\.400,50/)
    expect(vi.mocked(listBudgetExpenses)).toHaveBeenCalledWith(3)
  })

  it("sem orçamento não busca despesas", () => {
    renderWithProviders(<RecentExpensesWidget projectId={7} budget={null} />)

    expect(screen.getByText("Nenhum orçamento cadastrado.")).toBeInTheDocument()
    expect(vi.mocked(listBudgetExpenses)).not.toHaveBeenCalled()
  })
})
