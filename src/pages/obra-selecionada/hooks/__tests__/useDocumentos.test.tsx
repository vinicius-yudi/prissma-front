import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MAX_ATTACHMENT_SIZE_BYTES } from "@/shared/constants/attachments"
import type { Attachment } from "@/shared/types/attachment"
import { createHookWrapper } from "@/test/renderWithProviders"

import {
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  triggerFileDownload,
  uploadAttachment,
} from "../../services/attachments.service"
import { useDocumentos } from "../useDocumentos"

vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  triggerFileDownload: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(listAttachments)
const enviar = vi.mocked(uploadAttachment)
const excluir = vi.mocked(deleteAttachment)
const baixar = vi.mocked(downloadAttachment)
const salvarNoDisco = vi.mocked(triggerFileDownload)

function anexo(id: number, fileName: string, fileType: string): Attachment {
  return {
    id,
    constructionProjectId: 7,
    stageId: null,
    taskId: null,
    uploadedByUserId: 1,
    fileName,
    fileType,
    uploadedAt: "2026-01-01T00:00:00Z",
  }
}

const PDF = anexo(1, "planta.pdf", "application/pdf")
const FOTO = anexo(2, "obra.png", "image/png")

/** Arquivo com tamanho controlado — `File` não deixa escrever `size` direto. */
function arquivo(nome: string, tipo: string, bytes = 10): File {
  const file = new File(["x"], nome, { type: tipo })
  Object.defineProperty(file, "size", { value: bytes })
  return file
}

function render() {
  return renderHook(() => useDocumentos(7), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
  enviar.mockResolvedValue(PDF)
  excluir.mockResolvedValue(undefined)
  baixar.mockResolvedValue(new Blob(["conteúdo"]))
})

describe("useDocumentos — listagem", () => {
  // A aba Documentos e a aba Fotos leem o MESMO endpoint de anexos; o que
  // separa as duas é o filtro por MIME aqui.
  it("mostra só os documentos, deixando as imagens para a aba de fotos", async () => {
    listar.mockResolvedValue([PDF, FOTO])

    const { result } = render()

    await waitFor(() => expect(result.current.documents).toHaveLength(1))
    expect(result.current.documents[0].fileName).toBe("planta.pdf")
  })
})

describe("useDocumentos — validação do envio", () => {
  it("envia o PDF dentro do limite", async () => {
    const { result } = render()
    const file = arquivo("planta.pdf", "application/pdf")

    act(() => result.current.submitFile(file))

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(7, file))
  })

  it("aceita DOCX", async () => {
    const { result } = render()
    const file = arquivo(
      "memorial.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

    act(() => result.current.submitFile(file))

    await waitFor(() => expect(enviar).toHaveBeenCalled())
  })

  /**
   * As duas recusas são deliberadamente distintas: "grande demais" e "tipo não
   * suportado" pedem correções diferentes, e um "arquivo inválido" genérico
   * deixaria a pessoa sem saber o que ajustar.
   */
  it("recusa arquivo acima do limite antes de subir nada", async () => {
    const { result } = render()

    act(() =>
      result.current.submitFile(
        arquivo("gigante.pdf", "application/pdf", MAX_ATTACHMENT_SIZE_BYTES + 1),
      ),
    )

    expect(toast.error).toHaveBeenCalledWith("Arquivo acima do limite de 50 MB.")
    expect(enviar).not.toHaveBeenCalled()
  })

  it("recusa tipo que não é documento", async () => {
    const { result } = render()

    act(() => result.current.submitFile(arquivo("obra.png", "image/png")))

    expect(toast.error).toHaveBeenCalledWith("Tipo de arquivo não suportado. Envie PDF ou DOCX.")
    expect(enviar).not.toHaveBeenCalled()
  })
})

describe("useDocumentos — download", () => {
  it("baixa o arquivo e entrega com o nome original", async () => {
    const { result } = render()

    await act(async () => {
      await result.current.download(PDF)
    })

    expect(baixar).toHaveBeenCalledWith(7, 1)
    expect(salvarNoDisco).toHaveBeenCalledWith(expect.any(Blob), "planta.pdf")
  })

  // O botão da linha vira spinner só naquela linha: sem o id, a lista inteira
  // piscaria a cada download.
  it("marca só a linha em download e limpa ao terminar", async () => {
    let liberar: (blob: Blob) => void = () => {}
    baixar.mockImplementation(() => new Promise((resolve) => { liberar = resolve }))
    const { result } = render()

    act(() => { void result.current.download(PDF) })

    await waitFor(() => expect(result.current.downloadingId).toBe(1))

    await act(async () => { liberar(new Blob(["x"])) })

    await waitFor(() => expect(result.current.downloadingId).toBeNull())
  })

  it("avisa e libera a linha quando o download falha", async () => {
    baixar.mockRejectedValue(new Error("Erro 500"))
    const { result } = render()

    await act(async () => {
      await result.current.download(PDF)
    })

    expect(toast.error).toHaveBeenCalledWith("Erro ao baixar documento")
    expect(result.current.downloadingId).toBeNull()
    expect(salvarNoDisco).not.toHaveBeenCalled()
  })
})

describe("useDocumentos — exclusão", () => {
  it("repassa a exclusão para o anexo", async () => {
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 1))
  })
})
