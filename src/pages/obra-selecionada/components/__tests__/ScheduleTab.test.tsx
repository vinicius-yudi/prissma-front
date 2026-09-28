import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { ProjectPermission } from "../../services/projectPermissions.service"
import {
  getSchedule,
  updateResponsibility,
  upsertAllocation,
} from "../../services/schedule.service"
import { RoleInProject } from "../../types/equipes"
import { ScheduleView, type TeamSchedule } from "../../types/schedule"
import { useProjectPermissions } from "../../hooks/useProjectPermissions"
import { ScheduleTab } from "../ScheduleTab"

vi.mock("../../services/schedule.service", () => ({
  getSchedule: vi.fn(),
  upsertAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  updateResponsibility: vi.fn(),
}))
vi.mock("../../hooks/useProjectPermissions", () => ({ useProjectPermissions: vi.fn() }))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const buscar = vi.mocked(getSchedule)
const alocar = vi.mocked(upsertAllocation)
const responsabilidade = vi.mocked(updateResponsibility)
const permissoes = vi.mocked(useProjectPermissions)

const DIAS = ["2026-08-10", "2026-08-11"]

function semana(over: Partial<TeamSchedule> = {}): TeamSchedule {
  return {
    constructionProjectId: 7,
    view: ScheduleView.WEEK,
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    previousDate: "2026-08-03",
    nextDate: "2026-08-17",
    days: DIAS,
    members: [
      {
        userId: 10,
        userName: "João Souza",
        roleInProject: RoleInProject.ENGINEER,
        userResponsibility: "Estrutura",
        totalAllocatedHours: 8,
        hasOverlap: false,
        days: [
          { date: DIAS[0], allocatedHours: 8, allocated: true, overlapped: false, tasks: [] },
          { date: DIAS[1], allocatedHours: 0, allocated: false, overlapped: false, tasks: [] },
        ],
      },
    ],
    ...over,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue(semana())
  permissoes.mockReturnValue({
    isAdmin: false,
    roleInProject: RoleInProject.ENGINEER,
    isLoading: false,
    can: (permission) => permission === ProjectPermission.MANAGE_TEAMS,
  })
})

describe("estados da tela", () => {
  it("segura a grade atrás do esqueleto enquanto carrega", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />)

    expect(screen.queryByRole("table")).not.toBeInTheDocument()

    expect(await screen.findByRole("table")).toBeInTheDocument()
  })

  it("mostra erro de sistema com retry, sem sair da tela", async () => {
    buscar.mockRejectedValue(new Error("Erro 500"))
    renderWithProviders(<ScheduleTab projectId={7} />)

    expect(await screen.findByText("Não foi possível carregar o schedule.")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }))

    await waitFor(() => expect(buscar.mock.calls.length).toBeGreaterThan(1))
  })

  // Sem integrante não há o que alocar: o caminho é Equipes, não um modal.
  it("aponta para Equipes quando a obra não tem integrante", async () => {
    buscar.mockResolvedValue(semana({ members: [] }))
    renderWithProviders(<ScheduleTab projectId={7} />)

    expect(await screen.findByText("Nenhum integrante na obra")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Ir para Equipes/ })).toHaveAttribute(
      "href",
      "/obras/7/equipes",
    )
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

describe("grade carregada", () => {
  it("mostra período, grade e legenda", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />)

    expect(await screen.findByText("Semana de 10 a 16 ago 2026")).toBeInTheDocument()
    expect(screen.getByText("Agosto 2026")).toBeInTheDocument()
    expect(screen.getByText("Alocado")).toBeInTheDocument()
    expect(screen.getByText("Sobreposição")).toBeInTheDocument()
    expect(screen.getByText("Livre")).toBeInTheDocument()
  })

  it("navega para o próximo período com a referência da resposta", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />)
    await screen.findByRole("table")

    await userEvent.click(screen.getByRole("button", { name: "Próximo período" }))

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.WEEK, date: "2026-08-17" }),
    )
  })

  it("troca para o mês e descarta a data do período anterior", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />, {
      route: "/obras/7/schedule?view=WEEK&date=2026-08-12",
    })
    await screen.findByRole("table")

    await userEvent.click(screen.getByRole("button", { name: "Mês" }))

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.MONTH, date: undefined }),
    )
  })

  it("abre a alocação ao clicar numa célula", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />)
    await screen.findByRole("table")

    await userEvent.click(screen.getByRole("button", { name: /João Souza, 10\/08\/2026/ }))

    expect(await screen.findByRole("heading", { name: "Alocar horas" })).toBeInTheDocument()
  })

  it("abre a frente de trabalho pelo nome do integrante", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />)
    await screen.findByRole("table")

    await userEvent.click(
      screen.getByRole("button", { name: "Editar a frente de trabalho de João Souza" }),
    )

    expect(await screen.findByRole("heading", { name: "Frente de trabalho" })).toBeInTheDocument()
  })
})

describe("gravação", () => {
  it("grava as horas da célula e fecha o modal", async () => {
    alocar.mockResolvedValue({
      constructionProjectId: 7,
      userId: 10,
      userName: "João Souza",
      date: "2026-08-10",
      allocatedHours: 6,
    })
    renderWithProviders(<ScheduleTab projectId={7} />)
    await screen.findByRole("table")

    await userEvent.click(screen.getByRole("button", { name: /João Souza, 10\/08\/2026/ }))
    await userEvent.type(await screen.findByLabelText("Horas do dia"), "6")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() =>
      expect(alocar).toHaveBeenCalledWith({
        projectId: 7,
        userId: 10,
        date: "2026-08-10",
        allocatedHours: 6,
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Alocar horas" })).not.toBeInTheDocument(),
    )
  })

  it("grava a frente de trabalho e fecha o modal", async () => {
    responsabilidade.mockResolvedValue({
      constructionProjectId: 7,
      userId: 10,
      userName: "João Souza",
      userResponsibility: "Instalações",
    })
    renderWithProviders(<ScheduleTab projectId={7} />)
    await screen.findByRole("table")

    await userEvent.click(
      screen.getByRole("button", { name: "Editar a frente de trabalho de João Souza" }),
    )
    const campo = await screen.findByLabelText("Frente na obra")
    await userEvent.clear(campo)
    await userEvent.type(campo, "Instalações")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() =>
      expect(responsabilidade).toHaveBeenCalledWith({
        projectId: 7,
        userId: 10,
        userResponsibility: "Instalações",
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Frente de trabalho" })).not.toBeInTheDocument(),
    )
  })

  it("volta para a semana pelo segmentado", async () => {
    renderWithProviders(<ScheduleTab projectId={7} />, {
      route: "/obras/7/schedule?view=MONTH&date=2026-08-12",
    })
    await screen.findByRole("table")

    await userEvent.click(screen.getByRole("button", { name: "Semana" }))

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.WEEK, date: undefined }),
    )
  })
})
