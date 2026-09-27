import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import type { Attachment } from "@/shared/types/attachment"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  downloadAttachment,
  listAttachments,
  triggerFileDownload,
  uploadAttachment,
} from "../../services/attachments.service"
import { createDiarioEntry, deleteDiarioEntry, getDiarioEntries } from "../../services/diario.service"
import type { DiarioEntry, DiarioEntryType, DiarioPage } from "../../types/diario"
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
const dispararDownload = vi.mocked(triggerFileDownload)
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
  return {
    content,
    page,
    size: content.length,
    totalElements: content.length,
    totalPages: last ? page + 1 : page + 2,
    last,
  }
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

function render() {
  return renderWithProviders(<DiarioDaObra projectId={7} />)
}

/** Abre a folha do formulário e espera o campo de descrição. */
async function abrirFormulario() {
  await userEvent.click(screen.getByRole("button", { name: /Novo registro/ }))
  return screen.getByPlaceholderText(/Descreva ocorrências/)
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  listar.mockResolvedValue(pagina([]))
  listarAnexos.mockResolvedValue([])
  criar.mockResolvedValue(registro())
  excluir.mockResolvedValue(undefined)
  enviarAnexo.mockResolvedValue(ANEXO)
  baixarAnexo.mockResolvedValue(new Blob(["image-data"], { type: "image/png" }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("<DiarioDaObra /> — linha do tempo", () => {
  it("avisa enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    render()

    expect(screen.getByText("Carregando registros...")).toBeInTheDocument()
  })

  it("avisa quando o diário está vazio", async () => {
    render()

    expect(await screen.findByText("Nenhum registro encontrado.")).toBeInTheDocument()
  })

  it("mostra o erro da consulta com a mensagem do servidor", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    render()

    expect(await screen.findByText(/Não foi possível carregar o diário/)).toBeInTheDocument()
    expect(screen.getByText(/Erro 500/)).toBeInTheDocument()
  })

  it("lista os registros com tipo, responsável e descrição", async () => {
    listar.mockResolvedValue(pagina([registro()]))

    render()

    expect(await screen.findByText("Chuva forte pela manhã")).toBeInTheDocument()
    expect(screen.getAllByText("Ocorrência").length).toBeGreaterThan(0)
    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
  })

  it("conta os registros carregados", async () => {
    listar.mockResolvedValue(pagina([registro(), registro({ id: 2 })]))

    render()

    expect(await screen.findByText("2 registros")).toBeInTheDocument()
  })

  it.each([
    ["OCCURRENCE", "Ocorrência"],
    ["DELIVERY", "Entrega"],
    ["WORKFORCE", "Efetivo"],
    ["IMPEDIMENT", "Impedimento"],
  ] as [DiarioEntryType, string][])("traduz o tipo %s", async (entryType, rotulo) => {
    listar.mockResolvedValue(pagina([registro({ entryType })]))

    render()

    await screen.findByText("Chuva forte pela manhã")
    expect(screen.getAllByText(rotulo).length).toBeGreaterThan(0)
  })
})

describe("<DiarioDaObra /> — paginação", () => {
  it("não oferece carregar mais na última página", async () => {
    listar.mockResolvedValue(pagina([registro()]))

    render()

    await screen.findByText("Chuva forte pela manhã")
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument()
  })

  it("emenda a próxima página na linha do tempo", async () => {
    listar.mockImplementation((_id, page) =>
      Promise.resolve(
        pagina(
          [registro({ id: (page ?? 0) + 1, description: `Registro ${(page ?? 0) + 1}` })],
          (page ?? 0) === 1,
          page,
        ),
      ),
    )
    render()
    await screen.findByText("Registro 1")

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }))

    expect(await screen.findByText("Registro 2")).toBeInTheDocument()
    expect(screen.getByText("Registro 1")).toBeInTheDocument()
  })
})

describe("<DiarioDaObra /> — detalhes do registro", () => {
  it("abre os detalhes com responsável, descrição e indicação de anexo ausente", async () => {
    listar.mockResolvedValue(pagina([registro()]))
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Ver detalhes do registro de Ocorrência" }))

    expect(await screen.findByRole("heading", { name: "Detalhes do registro" })).toBeInTheDocument()
    expect(screen.getByText("Responsável")).toBeInTheDocument()
    expect(screen.getAllByText("Ana Souza").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Descrição")).toBeInTheDocument()
    expect(screen.getAllByText("Chuva forte pela manhã").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Nenhum anexo neste registro.")).toBeInTheDocument()
  })

  it("mostra os metadados e permite baixar um documento anexado", async () => {
    const documento = { ...ANEXO, fileName: "relatorio.pdf", fileType: "application/pdf" }
    listar.mockResolvedValue(pagina([registro({ attachmentId: documento.id })]))
    listarAnexos.mockResolvedValue([documento])
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Ver detalhes do registro de Ocorrência" }))

    expect(await screen.findByText("relatorio.pdf")).toBeInTheDocument()
    expect(screen.getByText("application/pdf")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Baixar arquivo" }))

    await waitFor(() => expect(baixarAnexo).toHaveBeenCalledWith(7, documento.id))
    expect(dispararDownload).toHaveBeenCalledWith(expect.any(Blob), "relatorio.pdf")
  })

  it("exibe preview de imagem anexada", async () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:diario-image-preview"),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL)
    listar.mockResolvedValue(pagina([registro({ attachmentId: ANEXO.id })]))
    listarAnexos.mockResolvedValue([ANEXO])
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Ver detalhes do registro de Ocorrência" }))

    expect(await screen.findByRole("img", { name: "obra.png" })).toHaveAttribute(
      "src",
      "blob:diario-image-preview",
    )
    expect(baixarAnexo).toHaveBeenCalledWith(7, ANEXO.id)
  })
})

describe("<DiarioDaObra /> — exclusão", () => {
  it("pede confirmação antes de excluir o registro", async () => {
    listar.mockResolvedValue(pagina([registro()]))
    render()

    await userEvent.click(await screen.findByRole("button", { name: "Excluir registro" }))

    expect(await screen.findByRole("heading", { name: "Excluir registro" })).toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 1))
  })
})

describe("<DiarioDaObra /> — novo registro", () => {
  it("abre a folha do formulário", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")

    await abrirFormulario()

    expect(screen.getByRole("heading", { name: "Adicionar registro" })).toBeInTheDocument()
  })

  // A data vai em ISO para o backend, mas o campo é datetime-local (sem fuso):
  // converter na hora de enviar é o que evita gravar a hora deslocada.
  it("cria o registro convertendo a data para ISO", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    const descricao = await abrirFormulario()

    await userEvent.type(descricao, "Chuva forte")
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toBe(7)
    expect(criar.mock.calls[0][1]).toMatchObject({
      description: "Chuva forte",
      entryType: "OCCURRENCE",
    })
    expect(criar.mock.calls[0][1].entryDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("manda o tipo escolhido", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    const descricao = await abrirFormulario()

    await userEvent.selectOptions(screen.getByRole("combobox"), "IMPEDIMENT")
    await userEvent.type(descricao, "Falta de material")
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }))

    await waitFor(() =>
      expect(criar.mock.calls[0][1]).toMatchObject({ entryType: "IMPEDIMENT" }),
    )
  })

  // Registro em branco não diz nada a ninguém: o botão fica travado até haver
  // texto de verdade.
  it("mantém o salvar travado enquanto a descrição está vazia", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    await abrirFormulario()

    expect(screen.getByRole("button", { name: "Salvar registro" })).toBeDisabled()
  })

  it("recusa descrição só de espaços", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    const descricao = await abrirFormulario()

    await userEvent.type(descricao, "   ")

    expect(screen.getByRole("button", { name: "Salvar registro" })).toBeDisabled()
  })

  it("limpa o rascunho e fecha a folha ao salvar", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    const descricao = await abrirFormulario()
    await userEvent.type(descricao, "Chuva forte")

    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }))

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Adicionar registro" })).not.toBeInTheDocument(),
    )
  })

  // O anexo sobe antes do registro: o backend guarda só o id, então o upload
  // precisa terminar para o registro saber a que arquivo se referir.
  it("anexa a foto e envia o id junto do registro", async () => {
    render()
    await screen.findByText("Nenhum registro encontrado.")
    const descricao = await abrirFormulario()

    const arquivo = new File(["x"], "obra.png", { type: "image/png" })
    await userEvent.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      arquivo,
    )
    await screen.findByText("obra.png")

    await userEvent.type(descricao, "Chuva forte")
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }))

    await waitFor(() => expect(criar.mock.calls[0][1]).toMatchObject({ attachmentId: 55 }))
  })
})

describe("<DiarioDaObra /> — somente leitura", () => {
  it("bloqueia o botão de novo registro", async () => {
    listar.mockResolvedValue(pagina([registro()]))
    mockAcesso(true)

    render()

    await screen.findByText("Chuva forte pela manhã")
    expect(screen.getByRole("button", { name: /Novo registro/ })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Excluir registro" })).not.toBeInTheDocument()
  })
})
