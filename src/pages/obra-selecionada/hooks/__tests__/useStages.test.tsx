import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { createHookWrapper } from "@/test/renderWithProviders"

import {
  createStage,
  deleteStage,
  listStages,
  reorderStages,
  updateStage,
  type Stage,
} from "../../services/stages.service"
import { useStages, useStagesList } from "../useStages"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(listStages)
const criar = vi.mocked(createStage)
const editar = vi.mocked(updateStage)
const excluir = vi.mocked(deleteStage)
const reordenar = vi.mocked(reorderStages)

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: null,
    displayOrder: 1,
    status: EtapaStatus.PLANNED,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

const PAYLOAD = {
  name: "Fundação",
  displayOrder: 1,
  status: EtapaStatus.PLANNED,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-03-20",
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
})

describe("useStagesList", () => {
  it("não consulta com obra inválida", () => {
    renderHook(() => useStagesList(0), { wrapper: createHookWrapper() })

    expect(listar).not.toHaveBeenCalled()
  })

  // A timeline e os cards iteram o retorno direto: `undefined` no carregamento
  // quebraria o `.map()`.
  it("devolve lista vazia enquanto carrega", () => {
    const { result } = renderHook(() => useStagesList(7), { wrapper: createHookWrapper() })

    expect(result.current.stages).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve as etapas da obra", async () => {
    listar.mockResolvedValue([etapa()])

    const { result } = renderHook(() => useStagesList(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.stages).toHaveLength(1))
    expect(listar).toHaveBeenCalledWith(7)
  })

  it("sinaliza erro da consulta", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    const { result } = renderHook(() => useStagesList(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useStages — criar, editar, excluir", () => {
  function render() {
    return renderHook(() => useStages(7), { wrapper: createHookWrapper() })
  }

  it("cria a etapa dentro da obra", async () => {
    criar.mockResolvedValue(etapa())
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0].slice(0, 2)).toEqual([7, PAYLOAD])
    expect(toast.success).toHaveBeenCalled()
  })

  it("edita pela rota da própria etapa", async () => {
    editar.mockResolvedValue(etapa())
    const { result } = render()

    act(() => result.current.update({ id: 3, payload: PAYLOAD }))

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0].slice(0, 2)).toEqual([3, PAYLOAD])
  })

  it("exclui a etapa", async () => {
    excluir.mockResolvedValue(undefined)
    const { result } = render()

    act(() => result.current.remove(3))

    await waitFor(() => expect(excluir).toHaveBeenCalled())
    expect(excluir.mock.calls[0][0]).toBe(3)
  })

  it("mostra a mensagem do backend quando a criação falha", async () => {
    criar.mockRejectedValue(new Error("Já existe etapa com esse nome."))
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Já existe etapa com esse nome."))
  })

  // Erro sem texto (queda de rede) não pode virar toast em branco.
  it("cai numa mensagem traduzida quando o erro não tem texto", async () => {
    excluir.mockRejectedValue(new Error(""))
    const { result } = render()

    act(() => result.current.remove(3))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(vi.mocked(toast.error).mock.calls[0][0]).toBeTruthy()
  })
})

describe("useStages — reordenar", () => {
  it("manda a ordem completa e avisa", async () => {
    reordenar.mockResolvedValue({ message: "ok", stages: [etapa({ id: 3 })] })
    const { result } = renderHook(() => useStages(7), { wrapper: createHookWrapper() })

    act(() => result.current.reorder([3, 1, 2]))

    await waitFor(() => expect(reordenar).toHaveBeenCalled())
    expect(reordenar.mock.calls[0].slice(0, 2)).toEqual([7, [3, 1, 2]])
    expect(toast.success).toHaveBeenCalled()
  })

  it("avisa e refaz a consulta quando a reordenação falha", async () => {
    reordenar.mockRejectedValue(new Error("Conflito de ordem."))
    const { result } = renderHook(() => useStages(7), { wrapper: createHookWrapper() })

    act(() => result.current.reorder([3, 1, 2]))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Conflito de ordem."))
  })
})

/**
 * O arraste faz duas coisas de uma vez — trocar de seção (status) e de posição
 * (ordem) — e elas vão numa mutation só para render UM toast e UM refetch. Os
 * testes cobrem as três combinações, porque cada uma dispara um caminho
 * diferente dentro da mesma função.
 */
describe("useStages — mover", () => {
  function render() {
    return renderHook(() => useStages(7), { wrapper: createHookWrapper() })
  }

  it("só troca o status quando o card muda de seção sem reordenar", async () => {
    editar.mockResolvedValue(etapa())
    const { result } = render()

    act(() =>
      result.current.move({ stage: etapa(), status: EtapaStatus.IN_PROGRESS }),
    )

    await waitFor(() => expect(editar).toHaveBeenCalled())
    // O PATCH exige nome e ordem; o resto fica como está no servidor.
    expect(editar.mock.calls[0][1]).toEqual({
      name: "Fundação",
      displayOrder: 1,
      status: EtapaStatus.IN_PROGRESS,
    })
    expect(reordenar).not.toHaveBeenCalled()
  })

  it("só reordena quando o card fica na mesma seção", async () => {
    reordenar.mockResolvedValue({ message: "ok", stages: [] })
    const { result } = render()

    act(() => result.current.move({ stage: etapa(), orderedIds: [2, 1] }))

    await waitFor(() => expect(reordenar).toHaveBeenCalled())
    expect(editar).not.toHaveBeenCalled()
  })

  it("faz as duas coisas quando o card muda de seção e de posição", async () => {
    editar.mockResolvedValue(etapa())
    reordenar.mockResolvedValue({ message: "ok", stages: [] })
    const { result } = render()

    act(() =>
      result.current.move({
        stage: etapa(),
        status: EtapaStatus.DONE,
        orderedIds: [1, 2],
      }),
    )

    await waitFor(() => expect(reordenar).toHaveBeenCalled())
    expect(editar).toHaveBeenCalled()
  })

  // Soltar o card na seção de onde ele saiu não é mudança de status: um PATCH
  // aqui gravaria o mesmo valor e ainda mostraria "movida para Planejada".
  it("não faz PATCH quando o status soltado é o mesmo de origem", async () => {
    reordenar.mockResolvedValue({ message: "ok", stages: [] })
    const { result } = render()

    act(() =>
      result.current.move({
        stage: etapa({ status: EtapaStatus.PLANNED }),
        status: EtapaStatus.PLANNED,
        orderedIds: [1],
      }),
    )

    await waitFor(() => expect(reordenar).toHaveBeenCalled())
    expect(editar).not.toHaveBeenCalled()
  })

  it("avisa quando o movimento falha", async () => {
    editar.mockRejectedValue(new Error("Etapa bloqueada."))
    const { result } = render()

    act(() => result.current.move({ stage: etapa(), status: EtapaStatus.DONE }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Etapa bloqueada."))
  })
})
