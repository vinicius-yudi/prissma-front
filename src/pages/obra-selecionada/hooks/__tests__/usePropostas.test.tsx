import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MAX_ATTACHMENT_SIZE_BYTES } from "@/shared/constants/attachments"
import { createHookWrapper } from "@/test/renderWithProviders"

import { ProposalRequestError } from "../../services/propostas.service"
import {
  addProposalVersion,
  changeVersionStatus,
  createProposal,
  deleteProposal,
  getProposal,
  listProposals,
  updateProposal,
} from "../../services/propostas.service"
import type { Proposal, ProposalPage, ProposalVersion } from "../../types/proposal"
import { useProposta, usePropostas } from "../usePropostas"

vi.mock("../../services/propostas.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/propostas.service")>()),
  listProposals: vi.fn(),
  getProposal: vi.fn(),
  createProposal: vi.fn(),
  updateProposal: vi.fn(),
  deleteProposal: vi.fn(),
  addProposalVersion: vi.fn(),
  changeVersionStatus: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(listProposals)
const detalhar = vi.mocked(getProposal)
const criar = vi.mocked(createProposal)
const atualizar = vi.mocked(updateProposal)
const excluir = vi.mocked(deleteProposal)
const novaVersao = vi.mocked(addProposalVersion)
const mudarStatus = vi.mocked(changeVersionStatus)

function versao(over: Partial<ProposalVersion> = {}): ProposalVersion {
  return {
    id: 10,
    version: 1,
    status: "DRAFT",
    description: null,
    authorUserId: 1,
    authorName: "Ana",
    generatedByAi: false,
    hasImage: true,
    fileName: "v1.png",
    fileType: "image/png",
    submittedAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    ...over,
  }
}

function proposta(over: Partial<Proposal> = {}): Proposal {
  return {
    id: 3,
    constructionProjectId: 7,
    stageId: null,
    title: "Sala de estar",
    description: null,
    environmentType: "LIVING_ROOM",
    createdByUserId: 1,
    createdByName: "Ana",
    latestVersion: versao(),
    versionCount: 1,
    versions: null,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    ...over,
  }
}

function pagina(content: Proposal[]): ProposalPage {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
  }
}

/** Arquivo com tamanho controlado — `File` não deixa escrever `size` direto. */
function arquivo(nome: string, tipo: string, bytes = 10): File {
  const file = new File(["x"], nome, { type: tipo })
  Object.defineProperty(file, "size", { value: bytes })
  return file
}

function render(projectId = 7) {
  return renderHook(() => usePropostas(projectId), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue(pagina([proposta()]))
  detalhar.mockResolvedValue(proposta({ versions: [versao()] }))
  criar.mockResolvedValue(proposta())
  atualizar.mockResolvedValue(proposta())
  excluir.mockResolvedValue(undefined)
  novaVersao.mockResolvedValue(versao({ id: 11, version: 2 }))
  mudarStatus.mockResolvedValue(versao({ status: "APPROVED" }))
})

describe("usePropostas", () => {
  it("entrega o conteúdo da página, não a página inteira", async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.proposals).toHaveLength(1))
    expect(result.current.proposals[0].title).toBe("Sala de estar")
  })

  it("não busca nada sem obra resolvida", () => {
    render(0)

    expect(listar).not.toHaveBeenCalled()
  })

  it("avisa e recarrega a lista ao criar", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    listar.mockClear()

    await act(async () => {
      await result.current.createAsync({
        payload: { title: "Cozinha", environmentType: "KITCHEN" },
        file: null,
      })
    })

    expect(criar).toHaveBeenCalledWith(
      7,
      { title: "Cozinha", environmentType: "KITCHEN" },
      null,
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    await waitFor(() => expect(listar).toHaveBeenCalled())
  })

  it("atualiza, exclui, versiona e muda status pelo mesmo caminho", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateAsync({
        proposalId: 3,
        payload: { title: "Sala nova", environmentType: "LIVING_ROOM" },
      })
    })
    act(() => result.current.remove(3))
    await act(async () => {
      await result.current.addVersionAsync({ proposalId: 3, file: arquivo("v2.png", "image/png") })
    })
    act(() =>
      result.current.changeStatus({ proposalId: 3, versionId: 10, status: "APPROVED" }),
    )

    await waitFor(() => expect(mudarStatus).toHaveBeenCalledWith(7, 3, 10, "APPROVED", undefined))
    expect(atualizar).toHaveBeenCalled()
    expect(excluir).toHaveBeenCalledWith(7, 3)
    expect(novaVersao).toHaveBeenCalled()
  })

  it("traduz 413 e 415 em vez de repassar a mensagem do servidor", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    criar.mockRejectedValueOnce(new ProposalRequestError(413, "Payload Too Large"))
    await act(async () => {
      await result.current
        .createAsync({ payload: { title: "x", environmentType: "OTHER" } })
        .catch(() => undefined)
    })
    expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining("50"))

    criar.mockRejectedValueOnce(new ProposalRequestError(415, "Unsupported Media Type"))
    await act(async () => {
      await result.current
        .createAsync({ payload: { title: "x", environmentType: "OTHER" } })
        .catch(() => undefined)
    })
    expect(toast.error).toHaveBeenLastCalledWith(
      "O conteúdo do arquivo não corresponde à extensão informada.",
    )
  })

  it("mostra a mensagem crua do servidor nos demais erros", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    excluir.mockRejectedValueOnce(new ProposalRequestError(409, "Proposta aprovada não pode sair."))
    act(() => result.current.remove(3))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Proposta aprovada não pode sair."),
    )
  })

  describe("validateImage", () => {
    it("recusa arquivo acima do limite", async () => {
      const { result } = render()
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const grande = arquivo("foto.png", "image/png", MAX_ATTACHMENT_SIZE_BYTES + 1)

      expect(result.current.validateImage(grande)).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("50"))
    })

    it("recusa o que não é imagem", async () => {
      const { result } = render()
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.validateImage(arquivo("planta.pdf", "application/pdf"))).toBe(false)
      expect(result.current.validateImage(arquivo("foto.png", "image/png"))).toBe(true)
    })
  })
})

describe("useProposta", () => {
  it("busca o detalhe com as versões", async () => {
    const { result } = renderHook(() => useProposta(7, 3), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.data?.versions).toHaveLength(1))
    expect(detalhar).toHaveBeenCalledWith(7, 3)
  })

  it("fica parada enquanto nenhuma proposta foi escolhida", () => {
    renderHook(() => useProposta(7, null), { wrapper: createHookWrapper() })

    expect(detalhar).not.toHaveBeenCalled()
  })
})

describe("erros das demais mutações", () => {
  it("avisa quando a nova versão falha", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    novaVersao.mockRejectedValueOnce(new Error("disco cheio"))

    await act(async () => {
      await result.current
        .addVersionAsync({ proposalId: 3, file: arquivo("v2.png", "image/png") })
        .catch(() => undefined)
    })

    expect(toast.error).toHaveBeenCalledWith("disco cheio")
  })

  it("avisa quando a mudança de status falha", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    mudarStatus.mockRejectedValueOnce(new Error("versão já aprovada"))

    act(() => result.current.changeStatus({ proposalId: 3, versionId: 10, status: "APPROVED" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("versão já aprovada"))
  })

  it("cai no texto padrão quando o erro vem sem mensagem", async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    atualizar.mockRejectedValueOnce(new Error(""))

    await act(async () => {
      await result.current
        .updateAsync({ proposalId: 3, payload: { title: "x", environmentType: "OTHER" } })
        .catch(() => undefined)
    })

    expect(toast.error).toHaveBeenCalledWith("Não foi possível atualizar a proposta.")
  })
})
