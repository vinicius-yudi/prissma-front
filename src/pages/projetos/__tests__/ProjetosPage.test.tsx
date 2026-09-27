import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { getProjectAcompanhamento, listProjects } from "../services/projects.service"
import { ProjetosPage } from "../index"

vi.mock("../services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectAcompanhamento: vi.fn(),
}))
// O modal de duas etapas tem teste próprio e traz o react-hook-form junto.
vi.mock("../components/ProjectStepModal", () => ({
  ProjectStepModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <button onClick={onClose}>modal-nova-obra</button> : null,
}))

const listar = vi.mocked(listProjects)

/** Datas relativas: o recorte "atrasados" compara com hoje. */
function emDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

function obra(id: number, title: string, over: Partial<Project> = {}): Project {
  return {
    id,
    title,
    address: "Rua das Palmeiras, 100",
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    city: null,
    state: null,
    zipCode: null,
    projectType: "Residencial",
    category: "Obra nova",
    landArea: 400,
    builtArea: 250,
    status: ProjectStatus.IN_PROGRESS,
    plannedStartDate: emDias(-30),
    plannedEndDate: emDias(30),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function render(route = "/obras") {
  return renderWithProviders(<ProjetosPage />, { route })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
  vi.mocked(getProjectAcompanhamento).mockReturnValue(new Promise(() => {}))
})

describe("<ProjetosPage /> — estados", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6)
  })

  it("mostra o erro quando a consulta falha", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    render()

    expect(await screen.findByText("Não foi possível carregar as obras")).toBeInTheDocument()
  })

  it("convida a criar quando não há obra", async () => {
    render()

    expect(await screen.findByText("Nenhuma obra ainda")).toBeInTheDocument()
  })

  it("lista as obras e oferece o card de nova obra no fim", async () => {
    listar.mockResolvedValue([obra(1, "Alfa"), obra(2, "Beta")])

    render()

    expect(await screen.findByRole("heading", { name: "Alfa" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Começar uma nova obra/ })).toBeInTheDocument()
  })

  it("troca para a visualização em lista pela URL", async () => {
    listar.mockResolvedValue([obra(1, "Alfa")])

    render()
    await screen.findByRole("heading", { name: "Alfa" })
    await userEvent.click(screen.getByRole("button", { name: "Lista" }))

    expect(screen.getByRole("button", { name: "Lista" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("heading", { name: "Alfa" })).not.toBeInTheDocument()
    expect(screen.getByText("Alfa")).toBeInTheDocument()
  })

  it("resume a carteira no subtítulo e na cota", async () => {
    listar.mockResolvedValue([
      obra(1, "Alfa"),
      obra(2, "Beta", { status: ProjectStatus.COMPLETED }),
    ])

    render()

    expect(await screen.findByText("1 em andamento, 0 em planejamento e 1 concluídas.")).toBeInTheDocument()
    expect(screen.getByText("2 obras")).toBeInTheDocument()
  })
})

describe("<ProjetosPage /> — filtros e busca", () => {
  const LISTA = [
    obra(1, "Em curso"),
    obra(2, "Pronta", { status: ProjectStatus.COMPLETED }),
    obra(3, "Atrasada", { plannedEndDate: emDias(-5) }),
  ]

  it("filtra pelas pílulas de recorte", async () => {
    listar.mockResolvedValue(LISTA)
    render()
    await screen.findByRole("heading", { name: "Em curso" })

    await userEvent.click(screen.getByRole("tab", { name: /Concluídas/ }))

    expect(screen.getByRole("heading", { name: "Pronta" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Em curso" })).not.toBeInTheDocument()
  })

  // "Atrasadas" é derivado da data, não um status do banco.
  it("recorta as atrasadas pela data", async () => {
    listar.mockResolvedValue(LISTA)
    render()
    await screen.findByRole("heading", { name: "Em curso" })

    await userEvent.click(screen.getByRole("tab", { name: /Atrasadas/ }))

    expect(screen.getByRole("heading", { name: "Atrasada" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Pronta" })).not.toBeInTheDocument()
  })

  /**
   * O termo mora na URL (`/obras?q=`), escrito pelo header: a lista lê de uma
   * fonte só, e o resultado filtrado sobrevive ao recarregar e vai por link.
   */
  it("aplica o termo de busca vindo da URL", async () => {
    listar.mockResolvedValue([obra(1, "Residencial Alfa"), obra(2, "Comercial Beta")])

    render("/obras?q=alfa")

    expect(await screen.findByRole("heading", { name: "Residencial Alfa" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Comercial Beta" })).not.toBeInTheDocument()
  })

  it("avisa quando a busca não encontra obra e limpa pelo atalho", async () => {
    listar.mockResolvedValue([obra(1, "Alfa")])

    render("/obras?q=zzz")

    expect(await screen.findByText("Nenhuma obra encontrada para “zzz”")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(await screen.findByRole("heading", { name: "Alfa" })).toBeInTheDocument()
  })

  it("busca pelo campo da própria página, sem acento", async () => {
    listar.mockResolvedValue([obra(1, "Residência Mercês"), obra(2, "Comercial Beta")])

    render()
    await screen.findByRole("heading", { name: "Comercial Beta" })
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar obras" }), "merces")

    expect(screen.getByRole("heading", { name: "Residência Mercês" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Comercial Beta" })).not.toBeInTheDocument()
  })

  it("ordena por nome", async () => {
    listar.mockResolvedValue([obra(1, "Beta"), obra(2, "Alfa")])

    render()
    await screen.findByRole("heading", { name: "Beta" })
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Ordenar" }), "nome")

    const titulos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    expect(titulos).toEqual(["Alfa", "Beta"])
  })
})

describe("<ProjetosPage /> — criar obra", () => {
  it("abre o modal pelo botão do cabeçalho", async () => {
    render()
    await screen.findByText("Nenhuma obra ainda")

    await userEvent.click(screen.getAllByRole("button", { name: /Nova obra/ })[0])

    expect(screen.getByText("modal-nova-obra")).toBeInTheDocument()
  })

  it("abre o modal pelo convite do estado vazio", async () => {
    render()
    await screen.findByText("Nenhuma obra ainda")

    const botoes = screen.getAllByRole("button", { name: /Nova obra/ })
    await userEvent.click(botoes[botoes.length - 1])

    expect(screen.getByText("modal-nova-obra")).toBeInTheDocument()
  })
})

/**
 * Sidebar, barra superior e busca ⌘K abrem o cadastro por `?nova=1` — o
 * atalho funciona de qualquer tela sem o shell conhecer o modal.
 */
describe("<ProjetosPage /> — atalho ?nova=1", () => {
  it("abre o cadastro direto pela URL e limpa o parâmetro ao fechar", async () => {
    render("/obras?nova=1")

    await userEvent.click(await screen.findByRole("button", { name: "modal-nova-obra" }))

    expect(screen.queryByText("modal-nova-obra")).not.toBeInTheDocument()
  })
})
