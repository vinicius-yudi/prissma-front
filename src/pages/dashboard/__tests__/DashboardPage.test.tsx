import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getProjectAcompanhamento, listProjects } from "@/pages/projetos/services/projects.service"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { DashboardPage } from "../index"
import { getMyTasks, type MyTask } from "../services/myTasks.service"
import { buildAlerts, buildWeek } from "../utils/dashboardData"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  listProjects: vi.fn(),
  getProjectAcompanhamento: vi.fn(),
}))
vi.mock("../services/myTasks.service", () => ({ getMyTasks: vi.fn() }))
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { name: "Marina Kowalski" } }) }))

const listar = vi.mocked(listProjects)
const minhasTarefas = vi.mocked(getMyTasks)

/** Relógio congelado numa tarde: saudação e "próximos 7 dias" dependem dele. */
const AGORA = new Date(2026, 5, 15, 15)

function obra(id: number, title: string, over: Partial<Project> = {}): Project {
  return {
    id,
    title,
    address: "Rua das Palmeiras, 100",
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    city: null,
    state: null,
    zipCode: null,
    projectType: "RESIDENTIAL",
    category: "BUILDING",
    landArea: 400,
    builtArea: 250,
    status: ProjectStatus.IN_PROGRESS,
    plannedStartDate: "2026-01-01",
    plannedEndDate: "2026-12-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function tarefa(id: number, over: Partial<MyTask> = {}): MyTask {
  return {
    id,
    projectId: 1,
    stageId: 1,
    stageName: "Alvenaria",
    title: `Tarefa ${id}`,
    priority: "MEDIUM",
    status: "TODO",
    plannedStartDate: "2026-06-01",
    plannedEndDate: "2026-06-17",
    ...over,
  }
}

function UrlSpy() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function render() {
  return renderWithProviders(
    <>
      <DashboardPage />
      <UrlSpy />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(AGORA)
  vi.resetAllMocks()
  vi.mocked(getProjectAcompanhamento).mockReturnValue(new Promise(() => {}))
  listar.mockResolvedValue([])
  minhasTarefas.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

describe("<DashboardPage />", () => {
  it("cumprimenta pelo primeiro nome conforme a hora", () => {
    render()

    expect(screen.getByRole("heading", { level: 1, name: "Boa tarde, Marina." })).toBeInTheDocument()
  })

  // Sem nada vencido, o Início diz isso em vez de uma lista vazia.
  it("diz que está tudo em dia quando não há atraso", async () => {
    render()

    expect(await screen.findByText("Nenhum atraso nas suas obras hoje.")).toBeInTheDocument()
    expect(screen.getByText("Tudo dentro do prazo nas suas tarefas e obras.")).toBeInTheDocument()
    expect(screen.getByText("Nenhuma obra em andamento")).toBeInTheDocument()
  })

  it("monta os KPIs com obras e tarefas reais", async () => {
    listar.mockResolvedValue([
      obra(1, "Alfa"),
      obra(2, "Beta", { status: ProjectStatus.PLANNING }),
      obra(3, "Gama", { status: ProjectStatus.COMPLETED }),
    ])
    minhasTarefas.mockResolvedValue([tarefa(1), tarefa(2, { status: "DONE" })])

    render()

    expect(await screen.findByText("1 em planejamento")).toBeInTheDocument()
    const tarefasAbertas = screen.getByText("Suas tarefas abertas").parentElement as HTMLElement
    expect(within(tarefasAbertas).getByLabelText("1")).toBeInTheDocument()
    expect(screen.getByText("de 3 obras na conta")).toBeInTheDocument()
    expect(await screen.findByText("1 vencem nos próximos 7 dias")).toBeInTheDocument()
  })

  it("lista o que precisa de decisão e leva para a aba certa", async () => {
    listar.mockResolvedValue([obra(1, "Alfa")])
    minhasTarefas.mockResolvedValue([tarefa(9, { title: "Concretar laje", plannedEndDate: "2026-06-13" })])

    render()

    const linha = await screen.findByRole("link", { name: /Concretar laje/ })
    expect(within(linha).getByText("Alfa — 2 dias de atraso")).toBeInTheDocument()
    expect(screen.getByText("1 ponto precisa de decisão")).toBeInTheDocument()

    await userEvent.click(linha)
    expect(screen.getByTestId("url")).toHaveTextContent("/obras/1/tarefas")
  })

  it("mostra as obras em andamento e o atalho para todas", async () => {
    listar.mockResolvedValue([obra(1, "Alfa"), obra(2, "Beta", { status: ProjectStatus.COMPLETED })])

    render()

    expect(await screen.findByRole("heading", { name: "Alfa" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Beta" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Todas as obras" })).toHaveAttribute("href", "/obras")
  })
})

describe("dados do Início", () => {
  // Bloqueada pesa mais que atrasada; obra vencida entra também.
  it("ordena os alertas por gravidade", () => {
    const obras = [obra(1, "Alfa", { plannedEndDate: "2026-06-10" })]
    const alertas = buildAlerts(
      [
        tarefa(1, { plannedEndDate: "2026-06-14" }),
        tarefa(2, { status: "BLOCKED", plannedEndDate: "2026-06-14" }),
        tarefa(3, { status: "DONE", plannedEndDate: "2026-06-01" }),
      ],
      obras,
    )

    expect(alertas.map((a) => a.kind)).toEqual(["blocked", "project", "task"])
  })

  it("ignora tarefas de obra concluída ou fora da conta", () => {
    const alertas = buildAlerts(
      [tarefa(1, { plannedEndDate: "2026-06-01" }), tarefa(2, { projectId: 99, plannedEndDate: "2026-06-01" })],
      [obra(1, "Alfa", { status: ProjectStatus.COMPLETED })],
    )

    expect(alertas).toEqual([])
  })

  it("distribui minhas tarefas abertas pelos próximos 7 dias", () => {
    const semana = buildWeek(
      [tarefa(1, { plannedEndDate: "2026-06-15", priority: "HIGH" }), tarefa(2, { plannedEndDate: "2026-06-30" })],
      [obra(1, "Alfa")],
    )

    expect(semana).toHaveLength(7)
    expect(semana[0].tasks).toHaveLength(1)
    expect(semana[0].tasks[0]).toMatchObject({ projectTitle: "Alfa", urgent: true })
    expect(semana.flatMap((d) => d.tasks)).toHaveLength(1)
  })
})
