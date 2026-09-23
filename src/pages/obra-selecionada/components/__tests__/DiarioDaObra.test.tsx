import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import type { Attachment } from "@/shared/types/attachment"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listAttachments, uploadAttachment } from "../../services/attachments.service"
import { createDiarioEntry, getDiarioEntries } from "../../services/diario.service"
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
const listarAnexos = vi.mocked(listAttachments)
const enviarAnexo = vi.mocked(uploadAttachment)
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
  enviarAnexo.mockResolvedValue(ANEXO)
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
    mockAcesso(true)

    render()

    await screen.findByText("Nenhum registro encontrado.")
    expect(screen.getByRole("button", { name: /Novo registro/ })).toBeDisabled()
  })
})
