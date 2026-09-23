import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Attachment } from "@/shared/types/attachment"
import { createHookWrapper } from "@/test/renderWithProviders"

import {
  AttachmentRequestError,
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from "../../services/attachments.service"
import { DOCUMENTO_LABELS, FOTO_LABELS, useAttachments } from "../useAttachments"

vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(listAttachments)
const enviar = vi.mocked(uploadAttachment)
const excluir = vi.mocked(deleteAttachment)

const ANEXO: Attachment = {
  id: 1,
  constructionProjectId: 7,
  stageId: null,
  taskId: null,
  uploadedByUserId: 1,
  fileName: "planta.pdf",
  fileType: "application/pdf",
  uploadedAt: "2026-01-01T00:00:00Z",
}

const ARQUIVO = new File(["x"], "planta.pdf", { type: "application/pdf" })

function render(labels = FOTO_LABELS) {
  return renderHook(() => useAttachments(7, { labels }), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
  enviar.mockResolvedValue(ANEXO)
  excluir.mockResolvedValue(undefined)
})

describe("useAttachments — listagem", () => {
  it("devolve lista vazia enquanto carrega", () => {
    const { result } = render()

    expect(result.current.attachments).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve os anexos da obra", async () => {
    listar.mockResolvedValue([ANEXO])

    const { result } = render()

    await waitFor(() => expect(result.current.attachments).toHaveLength(1))
    expect(listar).toHaveBeenCalledWith(7)
  })
})

/**
 * Os rótulos vêm por parâmetro porque o mesmo hook serve a Fotos e a
 * Documentos: "Foto adicionada" numa aba de PDFs seria confuso, e duplicar o
 * hook só pelo texto do toast seria pior.
 */
describe("useAttachments — rótulos por aba", () => {
  it("usa o texto de foto por padrão", async () => {
    const { result } = renderHook(() => useAttachments(7), { wrapper: createHookWrapper() })

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(FOTO_LABELS.uploadSuccess))
  })

  it("usa o texto de documento quando a aba pede", async () => {
    const { result } = render(DOCUMENTO_LABELS)

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(DOCUMENTO_LABELS.uploadSuccess))
  })
})

describe("useAttachments — envio", () => {
  it("envia o arquivo para a obra", async () => {
    const { result } = render()

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(7, ARQUIVO))
  })

  /**
   * O backend recusa por tamanho (413) e por conteúdo que não bate com a
   * extensão (415). Os dois pedem correções diferentes do usuário, então cada
   * um tem sua mensagem — a genérica do backend viria em inglês.
   */
  it("traduz o 413 citando o limite", async () => {
    enviar.mockRejectedValue(new AttachmentRequestError(413, "Payload Too Large"))
    const { result } = render()

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Arquivo acima do limite de 50 MB."),
    )
  })

  it("traduz o 415 falando de conteúdo, não de extensão", async () => {
    enviar.mockRejectedValue(new AttachmentRequestError(415, "Unsupported Media Type"))
    const { result } = render()

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O conteúdo do arquivo não corresponde à extensão informada.",
      ),
    )
  })

  it("mostra a mensagem do backend em outros status", async () => {
    enviar.mockRejectedValue(new AttachmentRequestError(500, "Falha no storage."))
    const { result } = render()

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Falha no storage."))
  })

  it("cai no rótulo da aba quando o erro não tem texto", async () => {
    enviar.mockRejectedValue(new Error(""))
    const { result } = render(DOCUMENTO_LABELS)

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(DOCUMENTO_LABELS.uploadError))
  })

  it("sinaliza o envio em andamento", async () => {
    let liberar = () => {}
    enviar.mockImplementation(() => new Promise((resolve) => { liberar = () => resolve(ANEXO) }))
    const { result } = render()

    act(() => result.current.upload(ARQUIVO))

    await waitFor(() => expect(result.current.isUploading).toBe(true))

    await act(async () => { liberar() })

    await waitFor(() => expect(result.current.isUploading).toBe(false))
  })
})

describe("useAttachments — exclusão", () => {
  it("exclui o anexo da obra", async () => {
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 1))
    expect(toast.success).toHaveBeenCalledWith(FOTO_LABELS.deleteSuccess)
  })

  it("mostra a mensagem do backend ao falhar", async () => {
    excluir.mockRejectedValue(new Error("Anexo referenciado no diário."))
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Anexo referenciado no diário."),
    )
  })

  it("cai no rótulo da aba quando o erro de exclusão não tem texto", async () => {
    excluir.mockRejectedValue(new Error(""))
    const { result } = render(DOCUMENTO_LABELS)

    act(() => result.current.remove(1))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(DOCUMENTO_LABELS.deleteError))
  })
})
