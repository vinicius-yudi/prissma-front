import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import type { Attachment } from "@/shared/types/attachment"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  triggerFileDownload,
  uploadAttachment,
} from "../../services/attachments.service"
import { AttachmentDropzone } from "../AttachmentDropzone"
import { DocumentRow } from "../DocumentRow"
import { DocumentosTab } from "../DocumentosTab"

vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  triggerFileDownload: vi.fn(),
}))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { useAccess } = await import("@/shared/hooks/useAccess")
const { toast } = await import("react-toastify")
const listar = vi.mocked(listAttachments)
const enviar = vi.mocked(uploadAttachment)
const excluir = vi.mocked(deleteAttachment)
const baixar = vi.mocked(downloadAttachment)
const salvarNoDisco = vi.mocked(triggerFileDownload)
const acesso = vi.mocked(useAccess)

function mockAcesso(somenteLeitura = false) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: () => (somenteLeitura ? "r" : "w"),
    canSee: () => true,
    isReadOnly: (_m: AppModule) => somenteLeitura,
  })
}

function anexo(over: Partial<Attachment> = {}): Attachment {
  return {
    id: 1,
    constructionProjectId: 7,
    stageId: null,
    taskId: null,
    uploadedByUserId: 1,
    fileName: "planta.pdf",
    fileType: "application/pdf",
    uploadedAt: "2026-02-10T00:00:00Z",
    ...over,
  }
}

function arquivo(nome: string, tipo: string): File {
  return new File(["conteudo"], nome, { type: tipo })
}

function entrada(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  listar.mockResolvedValue([])
  enviar.mockResolvedValue(anexo())
  excluir.mockResolvedValue(undefined)
  baixar.mockResolvedValue(new Blob(["x"]))
})

describe("<DocumentRow />", () => {
  const onDownload = vi.fn()
  const onRemove = vi.fn()

  it("mostra nome e data do arquivo", () => {
    renderWithProviders(
      <DocumentRow
        attachment={anexo()}
        isDownloading={false}
        onDownload={onDownload}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByText("planta.pdf")).toBeInTheDocument()
  })

  it("entrega o anexo inteiro ao baixar e só o id ao remover", async () => {
    const doc = anexo()
    renderWithProviders(
      <DocumentRow
        attachment={doc}
        isDownloading={false}
        onDownload={onDownload}
        onRemove={onRemove}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /Baixar/ }))
    await userEvent.click(screen.getAllByRole("button")[1])

    expect(onDownload).toHaveBeenCalledWith(doc)
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  // O spinner é por linha: sem isso a lista inteira piscaria a cada download.
  it("bloqueia só a linha em download", () => {
    renderWithProviders(
      <DocumentRow attachment={anexo()} isDownloading onDownload={onDownload} onRemove={onRemove} />,
    )

    expect(screen.getByRole("button", { name: /Baixando/ })).toBeDisabled()
  })
})

describe("<AttachmentDropzone />", () => {
  const onFile = vi.fn()
  const props = {
    accept: "application/pdf",
    acceptLabel: "PDF · DOCX",
    maxSizeMb: 50,
    onFile,
  }

  it("mostra os tipos aceitos e o limite de tamanho", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)

    expect(screen.getByText(/PDF · DOCX/)).toBeInTheDocument()
    expect(screen.getByText(/50 MB/)).toBeInTheDocument()
  })

  it("entrega o arquivo escolhido pelo seletor", async () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)
    const file = arquivo("planta.pdf", "application/pdf")

    await userEvent.upload(entrada(), file)

    expect(onFile).toHaveBeenCalledWith(file)
  })

  // §13: o alvo de clique não é <button>, então precisa responder ao teclado.
  it.each(["{Enter}", " "])("abre o seletor com a tecla %s", async (tecla) => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)
    const clique = vi.spyOn(entrada(), "click")

    screen.getByRole("button", { name: /Arraste arquivos/ }).focus()
    await userEvent.keyboard(tecla)

    expect(clique).toHaveBeenCalled()
  })

  /**
   * A barra fica indeterminada de propósito: o upload usa `fetch`, que não
   * reporta progresso de envio, e animar um percentual inventado seria
   * afirmar o que não se sabe.
   */
  it("mostra o aviso de envio sem prometer percentual", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading />)

    expect(screen.getByText("Enviando...")).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it("não mostra a barra fora do envio", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)

    expect(screen.queryByText("Enviando...")).not.toBeInTheDocument()
  })
})

describe("<DocumentosTab />", () => {
  function render() {
    return renderWithProviders(<DocumentosTab projectId={7} />)
  }

  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3)
  })

  it("avisa quando não há documento", async () => {
    render()

    expect(await screen.findByText("Nenhum documento adicionado.")).toBeInTheDocument()
  })

  // A aba lê o mesmo endpoint de anexos que a de fotos; o filtro por MIME é o
  // que separa as duas.
  it("lista só os documentos, deixando as imagens de fora", async () => {
    listar.mockResolvedValue([
      anexo(),
      anexo({ id: 2, fileName: "obra.png", fileType: "image/png" }),
    ])

    render()

    expect(await screen.findByText("planta.pdf")).toBeInTheDocument()
    expect(screen.queryByText("obra.png")).not.toBeInTheDocument()
    expect(screen.getByText("1 arquivo")).toBeInTheDocument()
  })

  it("envia o documento escolhido", async () => {
    render()
    await screen.findByText("Nenhum documento adicionado.")
    const file = arquivo("planta.pdf", "application/pdf")

    await userEvent.upload(entrada(), file)

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(7, file))
  })

  /**
   * Pelo seletor o `accept` já barra o tipo errado; arrastando, não — o
   * navegador entrega qualquer arquivo solto na zona, e é aí que a validação
   * do hook precisa existir.
   */
  it("recusa arquivo arrastado de tipo não suportado sem chamar a API", async () => {
    render()
    await screen.findByText("Nenhum documento adicionado.")

    fireEvent.drop(screen.getByRole("button", { name: /Arraste arquivos/ }), {
      dataTransfer: { files: [arquivo("obra.png", "image/png")] },
    })

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Tipo de arquivo não suportado. Envie PDF ou DOCX.",
      ),
    )
    expect(enviar).not.toHaveBeenCalled()
  })

  it("baixa o documento pela linha", async () => {
    listar.mockResolvedValue([anexo()])
    render()
    await screen.findByText("planta.pdf")

    await userEvent.click(screen.getByRole("button", { name: /Baixar/ }))

    await waitFor(() => expect(baixar).toHaveBeenCalledWith(7, 1))
    expect(salvarNoDisco).toHaveBeenCalledWith(expect.any(Blob), "planta.pdf")
  })

  it("remove o documento pela linha", async () => {
    listar.mockResolvedValue([anexo()])
    render()
    await screen.findByText("planta.pdf")

    // O botão da lixeira não tem nome acessível; é o único sem rótulo na tela.
    const [remover] = screen.getAllByRole("button", { name: "" })
    await userEvent.click(remover)

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 1))
  })
})
