import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import {
  createDiarioEntry,
  deleteDiarioEntry,
  getDiarioEntries,
} from "../../services/diario.service"
import type { DiarioEntry, DiarioPage } from "../../types/diario"
import { useDiario } from "../useDiario"

vi.mock("../../services/diario.service", () => ({
  getDiarioEntries: vi.fn(),
  createDiarioEntry: vi.fn(),
  deleteDiarioEntry: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(getDiarioEntries)
const criar = vi.mocked(createDiarioEntry)
const excluir = vi.mocked(deleteDiarioEntry)

function registro(id: number): DiarioEntry {
  return {
    id,
    constructionProjectId: 7,
    entryDate: "2026-02-01",
    entryType: "OCCURRENCE",
    responsibleUserId: 1,
    responsibleName: "Ana Souza",
    description: `Registro ${id}`,
    attachmentId: null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  }
}

function pagina(content: DiarioEntry[], last: boolean, page = 0): DiarioPage {
  return { content, page, size: content.length, totalElements: content.length, totalPages: last ? page + 1 : page + 2, last }
}

const PAYLOAD = {
  entryDate: "2026-02-01",
  entryType: "OCCURRENCE" as const,
  description: "Chuva forte",
}

function render(projectId = 7) {
  return renderHook(() => useDiario(projectId), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue(pagina([], true))
  criar.mockResolvedValue(registro(1))
  excluir.mockResolvedValue(undefined)
})

describe("useDiario — listagem", () => {
  it("não consulta com obra inválida", () => {
    render(0)

    expect(listar).not.toHaveBeenCalled()
  })

  it("busca a primeira página da obra", async () => {
    listar.mockResolvedValue(pagina([registro(1)], true))

    const { result } = render()

    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    expect(listar).toHaveBeenCalledWith(7, 0)
  })

  /**
   * O backend passou a paginar, mas ambientes antigos ainda devolvem um array
   * cru. Tratar só o objeto quebraria a tela nesses; normalizar aqui mantém o
   * componente com um formato só.
   */
  it("aceita a resposta antiga em forma de array", async () => {
    listar.mockResolvedValue([registro(1), registro(2)])

    const { result } = render()

    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    // Array cru não tem próxima página: é tudo o que existe.
    expect(result.current.hasNextPage).toBe(false)
  })

  it("expõe o erro da consulta", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})

describe("useDiario — rolagem infinita", () => {
  it("oferece a próxima página enquanto o backend não marca a última", async () => {
    listar.mockResolvedValue(pagina([registro(1)], false))

    const { result } = render()

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
  })

  it("emenda a página seguinte na lista já carregada", async () => {
    listar.mockImplementation((_id, page) =>
      Promise.resolve(pagina([registro((page ?? 0) + 1)], (page ?? 0) === 1, page)),
    )
    const { result } = render()
    await waitFor(() => expect(result.current.hasNextPage).toBe(true))

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(listar).toHaveBeenCalledWith(7, 1)
    expect(result.current.hasNextPage).toBe(false)
  })
})

describe("useDiario — gravações", () => {
  it("cria o registro na obra", async () => {
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(criar).toHaveBeenCalledWith(7, PAYLOAD))
    expect(toast.success).toHaveBeenCalledWith("Registro salvo com sucesso!")
  })

  it("exclui o registro da obra", async () => {
    const { result } = render()

    act(() => result.current.delete(3))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 3))
    expect(toast.success).toHaveBeenCalledWith("Registro excluído com sucesso!")
  })

  it.each([
    ["criação", () => criar.mockRejectedValue(new Error("Data futura.")), "create" as const],
    ["exclusão", () => excluir.mockRejectedValue(new Error("Data futura.")), "delete" as const],
  ])("mostra a mensagem do backend quando a %s falha", async (_caso, prepara, acao) => {
    prepara()
    const { result } = render()

    act(() => (acao === "create" ? result.current.create(PAYLOAD) : result.current.delete(3)))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Data futura."))
  })

  // Erro sem texto (queda de rede) não pode virar toast em branco.
  it("cai na mensagem traduzida quando o erro não tem texto", async () => {
    criar.mockRejectedValue(new Error(""))
    const { result } = render()

    act(() => result.current.create(PAYLOAD))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao salvar registro"))
  })
})
