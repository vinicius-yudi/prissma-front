import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import { ProjectPermission } from "../../services/projectPermissions.service"
import {
  deleteAllocation,
  getSchedule,
  updateResponsibility,
  upsertAllocation,
} from "../../services/schedule.service"
import { RoleInProject } from "../../types/equipes"
import { ScheduleView, type TeamSchedule } from "../../types/schedule"
import { useProjectPermissions } from "../useProjectPermissions"
import { useSchedule } from "../useSchedule"

vi.mock("../../services/schedule.service", () => ({
  getSchedule: vi.fn(),
  upsertAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  updateResponsibility: vi.fn(),
}))

// O hook de permissão puxa perfil, membros e permissões do papel — três
// requisições que não têm nada a ver com o que este teste protege.
vi.mock("../useProjectPermissions", () => ({ useProjectPermissions: vi.fn() }))

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const buscar = vi.mocked(getSchedule)
const alocar = vi.mocked(upsertAllocation)
const liberar = vi.mocked(deleteAllocation)
const responsabilidade = vi.mocked(updateResponsibility)
const permissoes = vi.mocked(useProjectPermissions)

const SEMANA: TeamSchedule = {
  constructionProjectId: 7,
  view: ScheduleView.WEEK,
  startDate: "2026-08-10",
  endDate: "2026-08-16",
  previousDate: "2026-08-03",
  nextDate: "2026-08-17",
  days: ["2026-08-10"],
  members: [
    {
      userId: 10,
      userName: "João Souza",
      roleInProject: RoleInProject.ENGINEER,
      userResponsibility: "Estrutura",
      totalAllocatedHours: 8,
      hasOverlap: false,
      days: [
        {
          date: "2026-08-10",
          allocatedHours: 8,
          allocated: true,
          overlapped: false,
          tasks: [],
        },
      ],
    },
  ],
}

function montar(route = "/obras/7/schedule") {
  return renderHook(() => useSchedule(7), { wrapper: createHookWrapper(route) })
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue(SEMANA)
  permissoes.mockReturnValue({
    isAdmin: false,
    roleInProject: RoleInProject.ENGINEER,
    isLoading: false,
    can: (permission) => permission === ProjectPermission.MANAGE_TEAMS,
  })
})

describe("estado de URL", () => {
  it("assume a semana e deixa o servidor resolver o dia de hoje", async () => {
    montar()

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.WEEK, date: undefined }),
    )
  })

  it("lê view e data da query string", async () => {
    montar("/obras/7/schedule?view=MONTH&date=2026-08-12")

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.MONTH, date: "2026-08-12" }),
    )
  })

  it("não consulta com obra inválida", () => {
    renderHook(() => useSchedule(0), { wrapper: createHookWrapper() })

    expect(buscar).not.toHaveBeenCalled()
  })

  // A data de referência é do período antigo: levada para a outra view, abre
  // um mês que ninguém pediu.
  it("descarta a data ao trocar de view", async () => {
    const { result } = montar("/obras/7/schedule?view=WEEK&date=2026-08-12")
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.setView(ScheduleView.MONTH))

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.MONTH, date: undefined }),
    )
  })
})

describe("navegação de período", () => {
  // O backend devolve previousDate/nextDate exatamente para o front não fazer
  // aritmética de data — somar 7 dias erraria na virada do mês.
  it("avança com a referência que a resposta trouxe", async () => {
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.goNext())

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.WEEK, date: "2026-08-17" }),
    )
  })

  it("volta com a referência anterior da resposta", async () => {
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.goPrevious())

    await waitFor(() =>
      expect(buscar).toHaveBeenCalledWith(7, { view: ScheduleView.WEEK, date: "2026-08-03" }),
    )
  })
})

describe("alocação", () => {
  it("grava as horas do dia", async () => {
    alocar.mockResolvedValue({
      constructionProjectId: 7,
      userId: 10,
      userName: "João Souza",
      date: "2026-08-10",
      allocatedHours: 8,
    })
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.saveAllocation({ userId: 10, date: "2026-08-10", hours: 8 }))

    await waitFor(() =>
      expect(alocar).toHaveBeenCalledWith({
        projectId: 7,
        userId: 10,
        date: "2026-08-10",
        allocatedHours: 8,
      }),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  // No banco `hours` tem CHECK (hours > 0): dia livre é ausência de linha, não
  // uma alocação de zero.
  it("zero vira DELETE, não um PUT com 0", async () => {
    liberar.mockResolvedValue(undefined)
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.saveAllocation({ userId: 10, date: "2026-08-10", hours: 0 }))

    await waitFor(() =>
      expect(liberar).toHaveBeenCalledWith({ projectId: 7, userId: 10, date: "2026-08-10" }),
    )
    expect(alocar).not.toHaveBeenCalled()
  })

  it("leva a mensagem do servidor para o toast", async () => {
    alocar.mockRejectedValue(new Error("Allocated hours must be greater than 0 and at most 24"))
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.saveAllocation({ userId: 10, date: "2026-08-10", hours: 99 }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Allocated hours must be greater than 0 and at most 24",
      ),
    )
  })
})

describe("frente de trabalho", () => {
  it("apara o texto antes de enviar", async () => {
    responsabilidade.mockResolvedValue({
      constructionProjectId: 7,
      userId: 10,
      userName: "João Souza",
      userResponsibility: "Estrutura",
    })
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() =>
      result.current.saveResponsibility({ userId: 10, userResponsibility: "  Estrutura  " }),
    )

    await waitFor(() =>
      expect(responsabilidade).toHaveBeenCalledWith({
        projectId: 7,
        userId: 10,
        userResponsibility: "Estrutura",
      }),
    )
  })

  it("manda null quando o campo fica em branco", async () => {
    responsabilidade.mockResolvedValue({
      constructionProjectId: 7,
      userId: 10,
      userName: "João Souza",
      userResponsibility: null,
    })
    const { result } = montar()
    await waitFor(() => expect(result.current.schedule).toBeDefined())

    act(() => result.current.saveResponsibility({ userId: 10, userResponsibility: "   " }))

    await waitFor(() =>
      expect(responsabilidade).toHaveBeenCalledWith({
        projectId: 7,
        userId: 10,
        userResponsibility: null,
      }),
    )
  })
})

describe("permissão de escrita", () => {
  it("libera a edição para quem gerencia equipes", async () => {
    const { result } = montar()

    await waitFor(() => expect(result.current.canMutate).toBe(true))
  })

  it("bloqueia quem não tem MANAGE_TEAMS", async () => {
    permissoes.mockReturnValue({
      isAdmin: false,
      roleInProject: RoleInProject.USER,
      isLoading: false,
      can: () => false,
    })
    const { result } = montar()

    await waitFor(() => expect(result.current.canMutate).toBe(false))
  })
})
