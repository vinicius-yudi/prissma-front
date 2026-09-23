import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  changeVersionStatus,
  createProposal,
  deleteProposal,
  fetchVersionImage,
  getPreview,
  getProposal,
  listProposals,
  requestPreview,
} from "../../services/propostas.service"
import type { Proposal, ProposalPage, ProposalVersion } from "../../types/proposal"
import { PropostasTab } from "../PropostasTab"

vi.mock("../../services/propostas.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/propostas.service")>()),
  listProposals: vi.fn(),
  getProposal: vi.fn(),
  createProposal: vi.fn(),
  deleteProposal: vi.fn(),
  addProposalVersion: vi.fn(),
  changeVersionStatus: vi.fn(),
  fetchVersionImage: vi.fn(),
  requestPreview: vi.fn(),
  getPreview: vi.fn(),
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
const listar = vi.mocked(listProposals)
const detalhar = vi.mocked(getProposal)
const criar = vi.mocked(createProposal)
const excluir = vi.mocked(deleteProposal)
const mudarStatus = vi.mocked(changeVersionStatus)
const baixarImagem = vi.mocked(fetchVersionImage)
const dispararPrevia = vi.mocked(requestPreview)
const consultarPrevia = vi.mocked(getPreview)
const acesso = vi.mocked(useAccess)

function mockAcesso(somenteLeitura = false) {
  acesso.mockReturnValue({
    profile: somenteLeitura ? "cliente" : "arquiteto",
    obraId: 7,
    isLoading: false,
    levelOf: () => (somenteLeitura ? "r" : "w"),
    canSee: () => true,
    isReadOnly: (_m: AppModule) => somenteLeitura,
  })
}

function versao(over: Partial<ProposalVersion> = {}): ProposalVersion {
  return {
    id: 10,
    version: 1,
    status: "PENDING_REVIEW",
    description: null,
    authorUserId: 1,
    authorName: "Ana",
    generatedByAi: false,
    hasImage: false,
    fileName: null,
    fileType: null,
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

function render() {
  return renderWithProviders(<PropostasTab projectId={7} />)
}

/** Aguarda a grade assentar — sem isto a asserção pega o esqueleto. */
async function aguardarGrade() {
  await screen.findByText("Sala de estar")
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  listar.mockResolvedValue(pagina([proposta()]))
  detalhar.mockResolvedValue(proposta({ versions: [versao()] }))
  criar.mockResolvedValue(proposta())
  excluir.mockResolvedValue(undefined)
  mudarStatus.mockResolvedValue(versao({ status: "APPROVED" }))
  baixarImagem.mockResolvedValue(new Blob(["png"]))
  dispararPrevia.mockResolvedValue({
    id: 9,
    proposalId: 3,
    status: "PROCESSING",
    versionId: null,
    errorMessage: null,
    createdAt: "2026-03-01T00:00:00Z",
    completedAt: null,
  })
  consultarPrevia.mockResolvedValue({
    id: 9,
    proposalId: 3,
    status: "PROCESSING",
    versionId: null,
    errorMessage: null,
    createdAt: "2026-03-01T00:00:00Z",
    completedAt: null,
  })
  // jsdom não implementa object URLs, e o card cria uma para cada thumbnail.
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:previa"),
    revokeObjectURL: vi.fn(),
  })
})

describe("<PropostasTab />", () => {
  it("desenha o card com versão e status da versão atual", async () => {
    render()
    await aguardarGrade()

    expect(screen.getByText("v1")).toBeInTheDocument()
    expect(screen.getByText("Em análise")).toBeInTheDocument()
    expect(screen.getByText("1 versão")).toBeInTheDocument()
  })

  it("mostra o aviso de IA antes de qualquer geração", async () => {
    render()
    await aguardarGrade()

    expect(
      screen.getAllByText(/pode levar até 40s por ambiente/i).length,
    ).toBeGreaterThan(0)
  })

  it("cai na hachura quando a versão não tem imagem", async () => {
    render()
    await aguardarGrade()

    expect(screen.getByText("Sem imagem ainda")).toBeInTheDocument()
    expect(baixarImagem).not.toHaveBeenCalled()
  })

  it("busca a imagem só quando a versão tem uma", async () => {
    listar.mockResolvedValue(pagina([proposta({ latestVersion: versao({ hasImage: true }) })]))
    render()
    await aguardarGrade()

    await waitFor(() => expect(baixarImagem).toHaveBeenCalledWith(7, 3, 10))
    expect(await screen.findByAltText(/Prévia da proposta Sala de estar/i)).toBeInTheDocument()
  })

  it("convida a criar a primeira proposta quando não há nenhuma", async () => {
    listar.mockResolvedValue(pagina([]))
    render()

    expect(await screen.findByText("Nenhuma proposta ainda")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /Nova proposta/i }).length).toBeGreaterThan(0)
  })

  it("avisa quando a listagem falha", async () => {
    listar.mockRejectedValue(new Error("timeout"))
    render()

    expect(await screen.findByText(/Erro ao carregar|não foi possível/i)).toBeInTheDocument()
  })

  describe("somente leitura", () => {
    beforeEach(() => mockAcesso(true))

    it("mostra a grade sem nenhuma ação de escrita", async () => {
      render()
      await aguardarGrade()

      expect(screen.queryByRole("button", { name: /Nova proposta/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Excluir proposta/i })).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Prévia visual IA/i })).toBeDisabled()
    })

    it("deixa o histórico aberto para consulta, sem aprovar nem rejeitar", async () => {
      const user = userEvent.setup()
      render()
      await aguardarGrade()

      await user.click(screen.getByRole("button", { name: /Ver versões/i }))

      expect(await screen.findByText("Histórico de versões")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument()
    })
  })

  describe("criação", () => {
    it("manda título e ambiente escolhidos", async () => {
      const user = userEvent.setup()
      render()
      await aguardarGrade()

      await user.click(screen.getByRole("button", { name: /Nova proposta/i }))
      await user.type(screen.getByLabelText(/Nome da proposta/i), "Cozinha")
      await user.selectOptions(screen.getByLabelText(/^Ambiente$/i), "KITCHEN")
      await user.click(screen.getByRole("button", { name: "Criar proposta" }))

      await waitFor(() =>
        expect(criar).toHaveBeenCalledWith(
          7,
          expect.objectContaining({ title: "Cozinha", environmentType: "KITCHEN" }),
          null,
        ),
      )
    })
  })

  describe("exclusão", () => {
    it("confirma antes de excluir", async () => {
      const user = userEvent.setup()
      render()
      await aguardarGrade()

      await user.click(screen.getByRole("button", { name: /Excluir proposta/i }))

      expect(await screen.findByText("Excluir proposta")).toBeInTheDocument()
      expect(excluir).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Excluir" }))

      await waitFor(() => expect(excluir).toHaveBeenCalledWith(7, 3))
    })
  })

  describe("histórico de versões", () => {
    it("busca o detalhe e aprova a versão escolhida", async () => {
      const user = userEvent.setup()
      render()
      await aguardarGrade()

      await user.click(screen.getByRole("button", { name: /Ver versões/i }))

      await waitFor(() => expect(detalhar).toHaveBeenCalledWith(7, 3))
      const dialogo = await screen.findByText("Histórico de versões")
      expect(dialogo).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Aprovar" }))

      await waitFor(() => expect(mudarStatus).toHaveBeenCalledWith(7, 3, 10, "APPROVED", undefined))
    })
  })

  describe("prévia por IA", () => {
    async function abrirPrevia() {
      const user = userEvent.setup()
      render()
      await aguardarGrade()
      await user.click(screen.getByRole("button", { name: /Prévia visual IA/i }))
      await screen.findByText("Foto do ambiente")
      return user
    }

    it("exige a foto do ambiente antes de disparar", async () => {
      const user = await abrirPrevia()

      await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

      expect(dispararPrevia).not.toHaveBeenCalled()
    })

    it("herda o ambiente da proposta e manda as opções escolhidas", async () => {
      const user = await abrirPrevia()

      const entradas = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
      fireEvent.change(entradas[0], {
        target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
      })

      await user.selectOptions(screen.getByLabelText(/Estilo/i), "INDUSTRIAL")
      await user.click(screen.getByRole("button", { name: "Verde" }))
      await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

      await waitFor(() =>
        expect(dispararPrevia).toHaveBeenCalledWith(
          7,
          3,
          expect.any(File),
          null,
          expect.objectContaining({
            // O ambiente vem da proposta, nunca do formulário.
            environment: "LIVING_ROOM",
            style: "INDUSTRIAL",
            colors: ["OFF_WHITE", "GREEN"],
          }),
        ),
      )
    })

    it("troca o botão do card pela barra de progresso enquanto gera", async () => {
      const user = await abrirPrevia()

      const entradas = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
      fireEvent.change(entradas[0], {
        target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
      })
      await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

      await waitFor(() => expect(consultarPrevia).toHaveBeenCalledWith(7, 3, 9))
      const progresso = await screen.findAllByRole("progressbar")
      expect(progresso.length).toBeGreaterThan(0)
      expect(screen.queryByRole("button", { name: /Prévia visual IA/i })).not.toBeInTheDocument()
    })

    it("fecha o formulário quando a prévia fica pronta", async () => {
      consultarPrevia.mockResolvedValue({
        id: 9,
        proposalId: 3,
        status: "READY",
        versionId: 11,
        errorMessage: null,
        createdAt: "2026-03-01T00:00:00Z",
        completedAt: "2026-03-01T00:00:40Z",
      })
      const user = await abrirPrevia()

      const entradas = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
      fireEvent.change(entradas[0], {
        target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
      })
      await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

      await waitFor(() => expect(screen.queryByText("Foto do ambiente")).not.toBeInTheDocument())
    })

    it("mantém o formulário aberto e mostra o erro quando a IA falha", async () => {
      consultarPrevia.mockResolvedValue({
        id: 9,
        proposalId: 3,
        status: "FAILED",
        versionId: null,
        errorMessage: "A OpenAI recusou a imagem de entrada.",
        createdAt: "2026-03-01T00:00:00Z",
        completedAt: "2026-03-01T00:00:40Z",
      })
      const user = await abrirPrevia()

      const entradas = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
      fireEvent.change(entradas[0], {
        target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
      })
      await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

      const erro = await screen.findByText("A OpenAI recusou a imagem de entrada.")
      expect(erro).toBeInTheDocument()
      expect(screen.getByText("Foto do ambiente")).toBeInTheDocument()
    })

    it("recusa mais de cinco cores na paleta", async () => {
      const user = await abrirPrevia()
      const { toast } = await import("react-toastify")

      // OFF_WHITE já vem marcada por padrão; mais cinco estouram o limite.
      for (const cor of ["Branco", "Bege", "Cinza claro", "Preto", "Verde"]) {
        await user.click(screen.getByRole("button", { name: cor }))
      }

      expect(toast.error).toHaveBeenCalledWith("No máximo 5 cores por prévia.")
      expect(screen.getByRole("button", { name: "Verde" })).toHaveAttribute(
        "aria-pressed",
        "false",
      )
    })
  })
})

describe("contagem da grade", () => {
  it("usa o plural certo", async () => {
    listar.mockResolvedValue(
      pagina([proposta(), proposta({ id: 4, title: "Cozinha", environmentType: "KITCHEN" })]),
    )
    mockAcesso()
    render()
    await aguardarGrade()

    expect(screen.getByText("2 propostas")).toBeInTheDocument()
  })
})

describe("caminhos de desistência", () => {
  it("fecha o formulário de prévia sem disparar nada", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Prévia visual IA/i }))
    await screen.findByText("Foto do ambiente")

    await user.click(screen.getByRole("button", { name: "Fechar" }))

    await waitFor(() => expect(screen.queryByText("Foto do ambiente")).not.toBeInTheDocument())
    expect(dispararPrevia).not.toHaveBeenCalled()
  })

  it("desiste da exclusão", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Excluir proposta/i }))
    await screen.findByText(/não pode ser desfeita/i)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByText(/não pode ser desfeita/i)).not.toBeInTheDocument(),
    )
    expect(excluir).not.toHaveBeenCalled()
  })

  it("fecha o histórico pelo rodapé", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Ver versões/i }))
    await screen.findByText("Histórico de versões")

    await user.click(screen.getByRole("button", { name: "Fechar" }))

    await waitFor(() =>
      expect(screen.queryByText("Histórico de versões")).not.toBeInTheDocument(),
    )
  })

  it("cancela a criação", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Nova proposta/i }))
    await screen.findByLabelText(/Nome da proposta/i)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByLabelText(/Nome da proposta/i)).not.toBeInTheDocument(),
    )
    expect(criar).not.toHaveBeenCalled()
  })

  it("abre o formulário a partir do estado vazio", async () => {
    listar.mockResolvedValue(pagina([]))
    const user = userEvent.setup()
    render()
    await screen.findByText("Nenhuma proposta ainda")

    await user.click(screen.getAllByRole("button", { name: /Nova proposta/i })[0])

    expect(await screen.findByLabelText(/Nome da proposta/i)).toBeInTheDocument()
  })

  it("oferece recarregar quando a listagem falha", async () => {
    const recarregar = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: recarregar },
    })
    listar.mockRejectedValue(new Error("timeout"))
    const user = userEvent.setup()
    render()

    await user.click(await screen.findByRole("button", { name: /Tentar novamente|Recarregar/i }))

    expect(recarregar).toHaveBeenCalled()
  })
})

describe("formulário de nova proposta", () => {
  it("recusa arquivo que não é imagem antes de subir", async () => {
    const user = userEvent.setup()
    const { toast } = await import("react-toastify")
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Nova proposta/i }))
    await user.type(await screen.findByLabelText(/Nome da proposta/i), "Cozinha")

    const entrada = document.getElementById("proposta-arquivo") as HTMLInputElement
    fireEvent.change(entrada, {
      target: { files: [new File(["x"], "planta.pdf", { type: "application/pdf" })] },
    })
    await user.click(screen.getByRole("button", { name: "Criar proposta" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(criar).not.toHaveBeenCalled()
  })

  it("sobe a imagem inicial junto com os dados", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Nova proposta/i }))
    await user.type(await screen.findByLabelText(/Nome da proposta/i), "Cozinha")
    await user.type(screen.getByLabelText(/Descrição/i), "bancada em L")

    const entrada = document.getElementById("proposta-arquivo") as HTMLInputElement
    fireEvent.change(entrada, {
      target: { files: [new File(["x"], "cozinha.png", { type: "image/png" })] },
    })
    await user.click(screen.getByRole("button", { name: "Criar proposta" }))

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: "Cozinha", description: "bancada em L" }),
        expect.any(File),
      ),
    )
  })

  it("reclama do título vazio sem chamar o servidor", async () => {
    const user = userEvent.setup()
    const { toast } = await import("react-toastify")
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Nova proposta/i }))
    await screen.findByLabelText(/Nome da proposta/i)

    await user.click(screen.getByRole("button", { name: "Criar proposta" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Título obrigatório"))
    expect(criar).not.toHaveBeenCalled()
  })
})

describe("formulário da prévia", () => {
  async function abrir() {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Prévia visual IA/i }))
    await screen.findByText("Foto do ambiente")
    return user
  }

  function entradasArquivo() {
    return document.querySelectorAll<HTMLInputElement>('input[type="file"]')
  }

  it("troca a foto escolhida", async () => {
    const user = await abrir()

    fireEvent.change(entradasArquivo()[0], {
      target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
    })
    expect(await screen.findByAltText("Foto do ambiente enviada")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Trocar foto" }))

    await waitFor(() =>
      expect(screen.queryByAltText("Foto do ambiente enviada")).not.toBeInTheDocument(),
    )
  })

  it("anexa e remove a planta baixa", async () => {
    const user = await abrir()

    fireEvent.change(entradasArquivo()[1], {
      target: { files: [new File(["x"], "planta.png", { type: "image/png" })] },
    })
    expect(await screen.findByText("planta.png")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remover" }))

    await waitFor(() => expect(screen.queryByText("planta.png")).not.toBeInTheDocument())
  })

  it("manda a planta junto quando ela foi anexada", async () => {
    const user = await abrir()

    fireEvent.change(entradasArquivo()[1], {
      target: { files: [new File(["x"], "planta.png", { type: "image/png" })] },
    })
    await screen.findByText("planta.png")
    fireEvent.change(entradasArquivo()[0], {
      target: { files: [new File(["x"], "sala.png", { type: "image/png" })] },
    })
    await user.type(screen.getByLabelText(/Instruções adicionais/i), "manter a janela")
    await user.click(screen.getByRole("button", { name: /Gerar prévia/i }))

    await waitFor(() =>
      expect(dispararPrevia).toHaveBeenCalledWith(
        7,
        3,
        expect.any(File),
        expect.any(File),
        expect.objectContaining({ additionalInstructions: "manter a janela" }),
      ),
    )
  })

  it("desmarca uma cor já escolhida", async () => {
    const user = await abrir()
    const branco = screen.getByRole("button", { name: "Branco off" })
    expect(branco).toHaveAttribute("aria-pressed", "true")

    await user.click(branco)

    expect(screen.getByRole("button", { name: "Branco off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("recusa foto que não é imagem", async () => {
    const { toast } = await import("react-toastify")
    await abrir()

    fireEvent.change(entradasArquivo()[0], {
      target: { files: [new File(["x"], "planta.pdf", { type: "application/pdf" })] },
    })

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.queryByAltText("Foto do ambiente enviada")).not.toBeInTheDocument()
  })
})

describe("detalhe do histórico", () => {
  it("mostra descrição, selo de IA e a versão mais recente primeiro", async () => {
    detalhar.mockResolvedValue(
      proposta({
        versions: [
          versao(),
          versao({
            id: 11,
            version: 2,
            status: "APPROVED",
            description: "sofá deslocado para a parede oposta",
            generatedByAi: true,
            hasImage: true,
          }),
        ],
      }),
    )
    const user = userEvent.setup()
    render()
    await aguardarGrade()

    await user.click(screen.getByRole("button", { name: /Ver versões/i }))

    expect(await screen.findByText("sofá deslocado para a parede oposta")).toBeInTheDocument()
    expect(screen.getAllByText("Gerada por IA").length).toBeGreaterThan(0)
    const lista = within(screen.getByRole("list"))
    const versoes = lista.getAllByText(/^v[12]$/).map((n) => n.textContent)
    expect(versoes).toEqual(["v2", "v1"])
  })

  it("pede ajustes na versão escolhida", async () => {
    const user = userEvent.setup()
    render()
    await aguardarGrade()
    await user.click(screen.getByRole("button", { name: /Ver versões/i }))
    await screen.findByText("Histórico de versões")

    await user.click(screen.getByRole("button", { name: "Pedir ajustes" }))

    await waitFor(() => expect(mudarStatus).toHaveBeenCalledWith(7, 3, 10, "REJECTED", undefined))
  })

  it("avisa quando o detalhe falha", async () => {
    detalhar.mockRejectedValue(new Error("timeout"))
    const user = userEvent.setup()
    render()
    await aguardarGrade()

    await user.click(screen.getByRole("button", { name: /Ver versões/i }))

    expect(await screen.findByText(/Erro ao carregar|não foi possível/i)).toBeInTheDocument()
  })
})
