import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import { getMyProfile } from "@/shared/services/user.service"
import type { Attachment } from "@/shared/types/attachment"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"
import { passarJanelaDoDesfazer, relogioDoDesfazer } from "@/test/undo"

import { downloadAttachment, listAttachments, uploadAttachment } from "../../services/attachments.service"
import { createDiarioEntry, deleteDiarioEntry, getDiarioEntries } from "../../services/diario.service"
import type { DiarioEntry, DiarioPage } from "../../types/diario"
import DiarioDaObra from "../DiarioDaObra"

vi.mock("../../services/diario.service", () => ({
  getDiarioEntries: vi.fn(),
  createDiarioEntry: vi.fn(),
  deleteDiarioEntry: vi.fn(),
}))
vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  triggerFileDownload: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { useAccess } = await import("@/shared/hooks/useAccess")
const listar = vi.mocked(getDiarioEntries)
const criar = vi.mocked(createDiarioEntry)
const excluir = vi.mocked(deleteDiarioEntry)
const listarAnexos = vi.mocked(listAttachments)
const enviarAnexo = vi.mocked(uploadAttachment)
const baixarAnexo = vi.mocked(downloadAttachment)

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

function registro(over: Partial<DiarioEntry> = {}): DiarioEntry {
  return {
    id: 1,
    constructionProjectId: 7,
    entryDate: "2026-02-10T14:30:00Z",
    entryType: "OCCURRENCE",
    responsibleUserId: 1,
    responsibleName: "Ana Souza",
    description: "Chuva forte pela manhã",
    attachmentId: null,
    createdAt: "2026-02-10T14:30:00Z",
    updatedAt: "2026-02-10T14:30:00Z",
    ...over,
  }
}

function pagina(content: DiarioEntry[], last = true, page = 0): DiarioPage {
  return { content, page, size: content.length, totalElements: content.length, totalPages: last ? page + 1 : page + 2, last }
}

const ANEXO: Attachment = {
  id: 55,
  constructionProjectId: 7,
  stageId: null,
  taskId: null,
  uploadedByUserId: 1,
  fileName: "obra.png",
  fileType: "image/png",
  uploadedAt: "2026-02-10T00:00:00Z",
}

function render(route = "/") {
  return renderWithProviders(<DiarioDaObra projectId={7} />, { route })
}

function texto() {
  return screen.getByLabelText("O que aconteceu")
}

async function abrirDetalhes(tipo = "Ocorrência") {
  await userEvent.click(await screen.findByRole("button", { name: `Ver detalhes do registro de ${tipo}` }))
  return within(await screen.findByRole("dialog", { name: "Detalhes do registro" }))
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  vi.mocked(getMyProfile).mockResolvedValue({ id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG })
  listar.mockResolvedValue(pagina([]))
  listarAnexos.mockResolvedValue([])
  criar.mockResolvedValue(registro())
  excluir.mockResolvedValue(undefined)
  enviarAnexo.mockResolvedValue(ANEXO)
  baixarAnexo.mockResolvedValue(new Blob(["image-data"], { type: "image/png" }))
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("<DiarioDaObra /> — linha do tempo", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))
    const { container } = render()
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("convida a registrar quando o diário está vazio", async () => {
    render()
    expect(await screen.findByText("Nenhum registro ainda")).toBeInTheDocument()
  })

  it("oferece recarregar quando a consulta falha", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))
    render()
    await screen.findByText("Não foi possível carregar o diário.")
    listar.mockClear()
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))
    await waitFor(() => expect(listar).toHaveBeenCalled())
  })

  it("agrupa por dia, do mais recente ao mais antigo, com Hoje e Ontem", async () => {
    const agora = new Date()
    const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1, 9)
    listar.mockResolvedValue(
      pagina([
        registro({ id: 1, entryDate: "2026-02-10T14:30:00Z", description: "Antigo" }),
        registro({ id: 2, entryDate: agora.toISOString(), entryType: "DELIVERY", description: "Chegou areia" }),
        registro({ id: 3, entryDate: ontem.toISOString(), entryType: "IMPEDIMENT", description: "Falta de cimento" }),
      ]),
    )
    render()

    await screen.findByText("Chegou areia")
    // A primeira região é o compositor ("Registro de hoje"); os dias vêm depois.
    const dias = screen.getAllByRole("region").slice(1)
    const nomes = dias.map((d) => d.getAttribute("aria-label"))
    expect(nomes.slice(0, 2)).toEqual(["Hoje", "Ontem"])
    expect(within(dias[0]).getByText("Chegou areia")).toBeInTheDocument()
    expect(within(dias[1]).getByText("Falta de cimento")).toBeInTheDocument()
    expect(within(dias[2]).getByText("Antigo")).toBeInTheDocument()
  })

  it("filtra por tipo pela URL e oferece mostrar tudo", async () => {
    listar.mockResolvedValue(pagina([registro({ id: 1 }), registro({ id: 2, entryType: "DELIVERY", description: "Blocos" })]))
    render("/?tipo=DELIVERY")

    expect(await screen.findByText("Blocos")).toBeInTheDocument()
    expect(screen.queryByText("Chuva forte pela manhã")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "Impedimentos" }))
    expect(screen.getByText("Nenhum registro com esse filtro.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Mostrar tudo" }))
    expect(screen.getByText("Chuva forte pela manhã")).toBeInTheDocument()
  })

  it("emenda a próxima página", async () => {
    listar.mockResolvedValueOnce(pagina([registro({ id: 1 })], false)).mockResolvedValueOnce(pagina([registro({ id: 2, description: "Segunda página" })], true, 1))
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }))
    expect(await screen.findByText("Segunda página")).toBeInTheDocument()
    expect(listar).toHaveBeenLastCalledWith(7, 1)
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument()
  })

  it("aceita a resposta em lista simples, sem paginação", async () => {
    listar.mockResolvedValue([registro()])
    render()
    expect(await screen.findByText("Chuva forte pela manhã")).toBeInTheDocument()
  })
})

describe("<DiarioDaObra /> — detalhes do registro", () => {
  it("mostra responsável, texto e a falta de anexo", async () => {
    listar.mockResolvedValue(pagina([registro()]))
    render()
    const dialog = await abrirDetalhes()
    expect(dialog.getByText("Ana Souza")).toBeInTheDocument()
    expect(dialog.getByText("Chuva forte pela manhã")).toBeInTheDocument()
    expect(dialog.getByText("Nenhum anexo neste registro.")).toBeInTheDocument()
  })

  it("mostra a prévia da imagem e baixa o arquivo", async () => {
    listar.mockResolvedValue(pagina([registro({ attachmentId: 55 })]))
    listarAnexos.mockResolvedValue([ANEXO])
    render()
    expect(await screen.findByText("Foto")).toBeInTheDocument()
    const dialog = await abrirDetalhes()

    expect(await dialog.findByRole("img", { name: "obra.png" })).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: /Baixar arquivo/ }))
    await waitFor(() => expect(baixarAnexo).toHaveBeenCalledTimes(2))
  })

  it("não baixa prévia de documento e avisa quando o download falha", async () => {
    listar.mockResolvedValue(pagina([registro({ attachmentId: 56 })]))
    listarAnexos.mockResolvedValue([{ ...ANEXO, id: 56, fileName: "laudo.pdf", fileType: "application/pdf" }])
    baixarAnexo.mockRejectedValue(new Error("falhou"))
    render()
    const dialog = await abrirDetalhes()

    expect(dialog.getByText("laudo.pdf")).toBeInTheDocument()
    expect(baixarAnexo).not.toHaveBeenCalled()
    await userEvent.click(dialog.getByRole("button", { name: /Baixar arquivo/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar o anexo."))
  })

  it("avisa quando a prévia não carrega ou o anexo sumiu", async () => {
    listar.mockResolvedValue(pagina([registro({ attachmentId: 55 }), registro({ id: 2, entryType: "DELIVERY", attachmentId: 99 })]))
    listarAnexos.mockResolvedValue([ANEXO])
    baixarAnexo.mockRejectedValue(new Error("falhou"))
    render()

    let dialog = await abrirDetalhes()
    expect(await dialog.findByText("Não foi possível carregar o anexo.")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    dialog = await abrirDetalhes("Entrega")
    expect(dialog.getByText("Os dados do anexo não estão disponíveis.")).toBeInTheDocument()
  })
})

describe("<DiarioDaObra /> — novo registro", () => {
  it("cria com o tipo escolhido e a data em ISO, e limpa o texto", async () => {
    render()
    await screen.findByText("Nenhum registro ainda")

    await userEvent.click(screen.getByRole("radio", { name: "Entrega" }))
    await userEvent.type(texto(), "  40 sacos de cimento  ")
    await userEvent.click(screen.getByRole("button", { name: /Registrar no diário/ }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    const [projeto, payload] = criar.mock.calls[0]
    expect(projeto).toBe(7)
    expect(payload).toMatchObject({ entryType: "DELIVERY", description: "40 sacos de cimento", attachmentId: null })
    expect(payload.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
    await waitFor(() => expect(texto()).toHaveValue(""))
    expect(screen.getByRole("radio", { name: "Entrega" })).toHaveAttribute("aria-checked", "true")
  })

  it("recusa texto vazio ou só de espaços com erro no campo", async () => {
    render()
    await userEvent.type(texto(), "   ")
    await userEvent.click(screen.getByRole("button", { name: /Registrar no diário/ }))
    expect(await screen.findByText("Escreva o que aconteceu.")).toBeInTheDocument()
    expect(criar).not.toHaveBeenCalled()
  })

  it("registra com Ctrl + Enter e troca o botão para perigo no impedimento", async () => {
    render()
    await userEvent.click(screen.getByRole("radio", { name: "Impedimento" }))
    expect(texto()).toHaveAttribute("placeholder", "O que parou a obra e o que é preciso para destravar.")
    await userEvent.type(texto(), "Sem energia{Control>}{Enter}{/Control}")
    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][1]).toMatchObject({ entryType: "IMPEDIMENT" })
  })

  it("anexa a foto, permite remover e envia o id junto", async () => {
    const { container } = render()
    const arquivo = new File(["x"], "obra.png", { type: "image/png" })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("sem input de arquivo")

    await userEvent.upload(input, arquivo)
    expect(await screen.findByText("obra.png")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Remover foto" }))
    expect(screen.getByRole("button", { name: /Anexar foto/ })).toBeInTheDocument()

    await userEvent.upload(input, arquivo)
    await screen.findByText("obra.png")
    await userEvent.type(texto(), "Foto da laje")
    await userEvent.click(screen.getByRole("button", { name: /Registrar no diário/ }))
    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][1]).toMatchObject({ attachmentId: 55 })
  })
})

describe("<DiarioDaObra /> — exclusão e leitura", () => {
  it("exclui com Desfazer: some da linha do tempo e vai ao servidor depois", async () => {
    relogioDoDesfazer()
    listar.mockResolvedValue(pagina([registro(), registro({ id: 2, description: "Outro registro" })]))
    render()

    await userEvent.click((await screen.findAllByRole("button", { name: "Excluir registro" }))[0])

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Excluir registro" })).toHaveLength(1))
    expect(excluir).not.toHaveBeenCalled()
    await passarJanelaDoDesfazer()
    await waitFor(() => expect(excluir).toHaveBeenCalled())
  })

  it("só leitura: sem compositor nem excluir", async () => {
    mockAcesso(true)
    listar.mockResolvedValue(pagina([registro()]))
    render()
    await screen.findByText("Chuva forte pela manhã")
    expect(screen.queryByLabelText("O que aconteceu")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir registro" })).not.toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
