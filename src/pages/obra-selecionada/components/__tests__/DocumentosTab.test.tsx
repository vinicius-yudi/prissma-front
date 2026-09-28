import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import type { AppModule } from "@/shared/constants/access"
import type { Attachment } from "@/shared/types/attachment"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  triggerFileDownload,
  uploadAttachment,
} from "../../services/attachments.service"
import { getEquipeMembers } from "../../services/equipes.service"
import { listStages } from "../../services/stages.service"
import { RoleInProject } from "../../types/equipes"
import { DocumentosTab } from "../DocumentosTab"

vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  triggerFileDownload: vi.fn(),
}))
vi.mock("../../services/stages.service", () => ({ listStages: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({ getEquipeMembers: vi.fn() }))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { useAccess } = await import("@/shared/hooks/useAccess")
const listar = vi.mocked(listAttachments)
const enviar = vi.mocked(uploadAttachment)
const excluir = vi.mocked(deleteAttachment)
const baixar = vi.mocked(downloadAttachment)
const salvarNoDisco = vi.mocked(triggerFileDownload)

function mockAcesso(somenteLeitura = false) {
  vi.mocked(useAccess).mockReturnValue({
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

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function arquivo(nome: string, tipo: string, tamanho = 10): File {
  const file = new File(["x"], nome, { type: tipo })
  Object.defineProperty(file, "size", { value: tamanho })
  return file
}

function entrada(): HTMLInputElement {
  return screen.getByTestId("documents-input") as HTMLInputElement
}

function render(route = "/") {
  return renderWithProviders(<DocumentosTab projectId={7} />, { route })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  listar.mockResolvedValue([])
  enviar.mockResolvedValue(anexo())
  excluir.mockResolvedValue(undefined)
  baixar.mockResolvedValue(new Blob(["x"]))
  vi.mocked(listStages).mockResolvedValue([
    {
      id: 3,
      constructionProjectId: 7,
      name: "Fundação",
      description: null,
      displayOrder: 1,
      status: EtapaStatus.IN_PROGRESS,
      plannedStartDate: null,
      plannedEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
      createdAt: "",
      updatedAt: "",
    },
  ])
  vi.mocked(getEquipeMembers).mockResolvedValue([
    {
      id: 10,
      constructionProjectId: 7,
      user: { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG },
      roleInProject: RoleInProject.ENGINEER,
      membershipStatus: "ACTIVE",
      joinedAt: "",
    },
  ])
})

describe("<DocumentosTab /> — lista", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))
    const { container } = render()
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("convida a anexar quando não há arquivo", async () => {
    render()
    expect(await screen.findByText("Nenhum documento")).toBeInTheDocument()
  })

  it("lista do mais recente ao mais antigo, com etapa e quem enviou", async () => {
    listar.mockResolvedValue([
      anexo({ id: 1, fileName: "antigo.pdf", uploadedAt: "2026-01-01T00:00:00Z" }),
      anexo({ id: 2, fileName: "laje.png", fileType: "image/png", stageId: 3, uploadedAt: "2026-03-01T00:00:00Z" }),
    ])
    render()

    const lista = within(await screen.findByRole("region", { name: "Documentos" }))
    const nomes = lista.getAllByRole("listitem").map((li) => li.querySelector("p")?.textContent)
    expect(nomes).toEqual(["laje.png", "antigo.pdf"])
    expect(lista.getByText(/Fundação/)).toBeInTheDocument()
    expect(await lista.findAllByText("Ana")).toHaveLength(2)
  })

  it("filtra por tipo com contagem e guarda na URL", async () => {
    listar.mockResolvedValue([anexo({ id: 1 }), anexo({ id: 2, fileName: "foto.jpg", fileType: "image/jpeg" })])
    render("/?tipo=img")

    expect(await screen.findByText("foto.jpg")).toBeInTheDocument()
    expect(screen.queryByText("planta.pdf")).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /DOC/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: /Todos/ }))
    expect(screen.getByText("planta.pdf")).toBeInTheDocument()
  })
})

describe("<DocumentosTab /> — filtro vazio", () => {
  it("oferece mostrar todos quando o tipo filtrado não tem arquivo", async () => {
    listar.mockResolvedValue([anexo()])
    render("/?tipo=img")
    expect(await screen.findByText("Nenhum arquivo desse tipo.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Mostrar todos" }))
    expect(screen.getByText("planta.pdf")).toBeInTheDocument()
  })
})

describe("<DocumentosTab /> — envio", () => {
  it("envia vários arquivos, vinculando à etapa escolhida", async () => {
    render()
    await screen.findByText("Nenhum documento")
    await waitFor(() => expect(screen.getByRole("option", { name: "Fundação" })).toBeInTheDocument())

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Vincular à etapa" }), "3")
    await userEvent.upload(entrada(), [arquivo("a.pdf", "application/pdf"), arquivo("b.docx", DOCX)])

    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(2))
    expect(enviar.mock.calls[0]).toEqual([7, expect.any(File), 3])
    expect(enviar.mock.calls[1][1].name).toBe("b.docx")
  })

  it("mostra a fila enquanto envia", async () => {
    let terminar: (value: Attachment) => void = () => {}
    enviar.mockImplementation(() => new Promise((resolve) => { terminar = resolve }))
    render()
    await screen.findByText("Nenhum documento")

    await userEvent.upload(entrada(), arquivo("a.pdf", "application/pdf"))

    expect(await screen.findByRole("progressbar", { name: "a.pdf" })).toBeInTheDocument()
    terminar(anexo())
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument())
  })

  it("recusa tipo não aceito e arquivo grande sem chamar a API", async () => {
    render()
    await screen.findByText("Nenhum documento")

    fireEvent.drop(screen.getByTestId("documents-dropzone"), {
      dataTransfer: { files: [arquivo("planilha.xlsx", "application/vnd.ms-excel"), arquivo("big.pdf", "application/pdf", 60 * 1024 * 1024)] },
    })

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("planilha.xlsx"))
    expect(toast.error).toHaveBeenCalledWith("Arquivo acima do limite de 50 MB.")
    expect(enviar).not.toHaveBeenCalled()
  })

  it("avisa quando passa do limite por envio", async () => {
    render()
    await screen.findByText("Nenhum documento")

    const muitos = Array.from({ length: 9 }, (_, i) => arquivo(`f${i}.pdf`, "application/pdf"))
    await userEvent.upload(entrada(), muitos)

    expect(toast.info).toHaveBeenCalled()
    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(8))
  })

  it("destaca a zona ao arrastar por cima", async () => {
    render()
    await screen.findByText("Nenhum documento")
    const zona = screen.getByTestId("documents-dropzone")

    fireEvent.dragOver(zona)
    expect(screen.getByText("Solte para anexar")).toBeInTheDocument()
    fireEvent.dragLeave(zona)
    expect(screen.getByText("Arraste plantas, fotos e contratos")).toBeInTheDocument()
  })
})

describe("<DocumentosTab /> — ações", () => {
  it("baixa com o nome original e avisa quando falha", async () => {
    listar.mockResolvedValue([anexo()])
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Baixar planta.pdf" }))
    await waitFor(() => expect(salvarNoDisco).toHaveBeenCalledWith(expect.any(Blob), "planta.pdf"))

    baixar.mockRejectedValue(new Error("falhou"))
    await userEvent.click(screen.getByRole("button", { name: "Baixar planta.pdf" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível baixar o arquivo."))
  })

  it("exclui depois de confirmar", async () => {
    listar.mockResolvedValue([anexo()])
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Excluir planta.pdf" }))
    const dialog = within(await screen.findByRole("dialog"))
    await userEvent.click(dialog.getByRole("button", { name: "Cancelar" }))
    expect(excluir).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole("button", { name: "Excluir planta.pdf" }))
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Excluir" }))
    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 1))
  })

  it("só leitura: sem envio nem exclusão, mas baixa", async () => {
    mockAcesso(true)
    listar.mockResolvedValue([anexo()])
    render()

    expect(await screen.findByRole("button", { name: "Baixar planta.pdf" })).toBeInTheDocument()
    expect(screen.queryByTestId("documents-dropzone")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir planta.pdf" })).not.toBeInTheDocument()
  })
})
