import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import {
  createTarefa,
  deleteTarefa,
  getTarefas,
  updateTarefa,
} from "../../services/tarefas.service"
import type { CreateTarefaRequest, Tarefa } from "../../types/tarefas"
import { useTarefas } from "../useTarefas"

vi.mock("../../services/tarefas.service", () => ({
  getTarefas: vi.fn(),
  getTarefa: vi.fn(),
  createTarefa: vi.fn(),
  updateTarefa: vi.fn(),
  deleteTarefa: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(getTarefas)
const criar = vi.mocked(createTarefa)
const editar = vi.mocked(updateTarefa)
const excluir = vi.mocked(deleteTarefa)

function tarefa(over: Partial<Tarefa> = {}): Tarefa {
  return {
    id: 1,
    title: "Concretar laje",
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
    ...over,
  }
}

const PAYLOAD: CreateTarefaRequest = {
  title: "Concretar laje",
  description: "",
  priority: "MEDIUM",
  status: "TODO",
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-03-05",
  assigneeUserId: 1,
}

function render(stageId: number | null = 3) {
  return renderHook(() => useTarefas(stageId), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
  criar.mockResolvedValue(tarefa())
  editar.mockResolvedValue(tarefa())
  excluir.mockResolvedValue(undefined)
})

describe("useTarefas — consulta", () => {
  // As tarefas pendem da etapa: sem etapa selecionada não há rota para chamar.
  it.each([
    ["etapa nula", null],
    ["etapa inválida", 0],
  ])("não consulta com %s", (_caso, stageId) => {
    render(stageId)

    expect(listar).not.toHaveBeenCalled()
  })

  it("devolve lista vazia enquanto carrega", () => {
    const { result } = render()

    expect(result.current.tarefas).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve as tarefas da etapa", async () => {
    listar.mockResolvedValue([tarefa()])

    const { result } = render()

    await waitFor(() => expect(result.current.tarefas).toHaveLength(1))
    expect(listar).toHaveBeenCalledWith(3)
  })

  it("expõe o erro da consulta", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})

describe("useTarefas — gravações", () => {
  it("cria a tarefa dentro da etapa", async () => {
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(criar).toHaveBeenCalledWith(3, PAYLOAD))
    expect(toast.success).toHaveBeenCalled()
  })

  it("edita mandando a etapa e o id da tarefa", async () => {
    const { result } = render()

    act(() => result.current.update({ id: 9, data: { status: "DONE" } }))

    await waitFor(() => expect(editar).toHaveBeenCalledWith(3, 9, { status: "DONE" }))
  })

  it("exclui pela rota da etapa", async () => {
    const { result } = render()

    act(() => result.current.delete(9))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(3, 9))
  })

  it("expõe a versão async da criação, que o formulário aguarda para fechar", async () => {
    const { result } = render()

    await act(async () => {
      await result.current.createAsync(PAYLOAD)
    })

    expect(criar).toHaveBeenCalled()
  })

  it.each([
    ["criação", (r: ReturnType<typeof render>["result"]) => r.current.create(PAYLOAD), criar],
    [
      "edição",
      (r: ReturnType<typeof render>["result"]) => r.current.update({ id: 9, data: {} }),
      editar,
    ],
    ["exclusão", (r: ReturnType<typeof render>["result"]) => r.current.delete(9), excluir],
  ])("mostra a mensagem do backend quando a %s falha", async (_caso, acao, mock) => {
    ;(mock as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Etapa concluída."))
    const { result } = render()

    act(() => acao(result))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Etapa concluída."))
  })

  // Erro sem texto (queda de rede) não pode virar toast em branco.
  it("cai numa mensagem própria quando o erro não tem texto", async () => {
    criar.mockRejectedValue(new Error(""))
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao criar tarefa"))
  })
})
