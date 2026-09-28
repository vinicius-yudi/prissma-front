import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { createHookWrapper } from "@/test/renderWithProviders"

import { listStages, type Stage } from "../../services/stages.service"
import { getTarefas } from "../../services/tarefas.service"
import type { Tarefa } from "../../types/tarefas"
import { useTarefasByProject } from "../useTarefasByProject"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("../../services/tarefas.service", () => ({
  getTarefas: vi.fn(),
  getTarefa: vi.fn(),
  createTarefa: vi.fn(),
  updateTarefa: vi.fn(),
  deleteTarefa: vi.fn(),
}))

const listarEtapas = vi.mocked(listStages)
const listarTarefas = vi.mocked(getTarefas)

function etapa(id: number, name: string): Stage {
  return {
    id,
    constructionProjectId: 7,
    name,
    description: null,
    displayOrder: id,
    status: EtapaStatus.PLANNED,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function tarefa(id: number): Tarefa {
  return {
    id,
    title: `Tarefa ${id}`,
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-03-05",
    assigneeUserId: null,
    assigneeName: null,
    constructionProjectId: 7,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function render(projectId: number | null = 7) {
  return renderHook(() => useTarefasByProject(projectId), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarEtapas.mockResolvedValue([])
  listarTarefas.mockResolvedValue([])
})

describe("useTarefasByProject", () => {
  it.each([
    ["obra nula", null],
    ["obra inválida", 0],
  ])("não consulta com %s", (_caso, projectId) => {
    render(projectId)

    expect(listarEtapas).not.toHaveBeenCalled()
  })

  /**
   * As tarefas vivem em `/stages/{id}/tasks`: não existe rota que devolva as
   * da obra inteira. O hook busca as etapas e dispara uma consulta por etapa —
   * é o `useQueries` que evita um `useQuery` dentro de laço.
   */
  it("dispara uma consulta de tarefas por etapa", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação"), etapa(2, "Alvenaria")])

    render()

    await waitFor(() => expect(listarTarefas).toHaveBeenCalledTimes(2))
    expect(listarTarefas).toHaveBeenCalledWith(1)
    expect(listarTarefas).toHaveBeenCalledWith(2)
  })

  it("casa cada etapa com as tarefas dela", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação")])
    listarTarefas.mockResolvedValue([tarefa(10)])

    const { result } = render()

    await waitFor(() => expect(result.current.stages[0]?.tasks).toHaveLength(1))
    expect(result.current.stages[0].stage.name).toBe("Fundação")
  })

  // O kanban itera `tasks` direto: `undefined` no carregamento quebraria o map.
  it("devolve lista vazia de tarefas enquanto a etapa carrega", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação")])
    listarTarefas.mockImplementation(() => new Promise(() => {}))

    const { result } = render()

    await waitFor(() => expect(result.current.stages).toHaveLength(1))
    expect(result.current.stages[0].tasks).toEqual([])
    expect(result.current.stages[0].isLoading).toBe(true)
  })

  it("expõe o erro da etapa sem derrubar as outras", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação"), etapa(2, "Alvenaria")])
    listarTarefas.mockImplementation((id) =>
      id === 1 ? Promise.reject(new Error("Erro 500")) : Promise.resolve([tarefa(10)]),
    )

    const { result } = render()

    await waitFor(() => expect(result.current.stages[0].error).toBeTruthy())
    expect(result.current.stages[1].tasks).toHaveLength(1)
  })

  it("expõe o erro da consulta de etapas", async () => {
    listarEtapas.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })

  it("segue carregando enquanto qualquer etapa ainda busca tarefas", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação")])
    listarTarefas.mockImplementation(() => new Promise(() => {}))

    const { result } = render()

    await waitFor(() => expect(result.current.stages).toHaveLength(1))
    expect(result.current.isLoading).toBe(true)
  })

  it("recarrega etapas e tarefas de uma vez", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação")])
    const { result } = render()
    await waitFor(() => expect(result.current.stages).toHaveLength(1))
    listarEtapas.mockClear()
    listarTarefas.mockClear()

    act(() => result.current.refetch())

    await waitFor(() => expect(listarEtapas).toHaveBeenCalled())
    await waitFor(() => expect(listarTarefas).toHaveBeenCalled())
  })
})
