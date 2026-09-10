import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listProjects } from "../services/projects.service"
import { ProjetosPage } from "../index"

vi.mock("../services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))
// O modal de duas etapas tem teste próprio e traz o react-hook-form junto.
vi.mock("../components/ProjectStepModal", () => ({
  ProjectStepModal: ({ open }: { open: boolean }) => (open ? <div>modal-nova-obra</div> : null),
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

    expect(await screen.findByText("Erro ao carregar projetos")).toBeInTheDocument()
  })

  it("convida a criar quando não há obra", async () => {
    render()

    expect(await screen.findByText("Nenhum projeto encontrado")).toBeInTheDocument()
  })

  it("lista as obras em grupo único com a contagem", async () => {
    listar.mockResolvedValue([obra(1, "Alfa"), obra(2, "Beta")])

    render()

    expect(await screen.findByRole("heading", { name: "Alfa" })).toBeInTheDocument()
    expect(screen.getByText("Todas as obras")).toBeInTheDocument()
  })

  // A legenda técnica é o subtítulo do H1: total e quantas estão em andamento.
  it("resume total e obras em andamento na legenda", async () => {
    listar.mockResolvedValue([
      obra(1, "Alfa"),
      obra(2, "Beta", { status: ProjectStatus.COMPLETED }),
    ])

    render()

    expect(await screen.findByText("2 obras · 1 em andamento")).toBeInTheDocument()
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

    await userEvent.click(screen.getByRole("button", { name: /Concluídos/ }))

    expect(screen.getByRole("heading", { name: "Pronta" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Em curso" })).not.toBeInTheDocument()
  })

  // "Atrasadas" é derivado da data, não um status do banco.
  it("recorta as atrasadas pela data", async () => {
    listar.mockResolvedValue(LISTA)
    render()
    await screen.findByRole("heading", { name: "Em curso" })

    await userEvent.click(screen.getByRole("button", { name: /Atrasados/ }))

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

  it("avisa quando o filtro não deixa nenhuma obra", async () => {
    listar.mockResolvedValue([obra(1, "Alfa")])

    render("/obras?q=zzz")

    expect(await screen.findByText("Nenhum projeto encontrado")).toBeInTheDocument()
  })
})

describe("<ProjetosPage /> — criar obra", () => {
  it("abre o modal pelo botão do cabeçalho", async () => {
    render()
    await screen.findByText("Nenhum projeto encontrado")

    await userEvent.click(screen.getAllByRole("button", { name: /Novo Projeto/ })[0])

    expect(screen.getByText("modal-nova-obra")).toBeInTheDocument()
  })

  it("abre o modal pelo convite do estado vazio", async () => {
    render()
    await screen.findByText("Nenhum projeto encontrado")

    const botoes = screen.getAllByRole("button", { name: /Novo Projeto/ })
    await userEvent.click(botoes[botoes.length - 1])

    expect(screen.getByText("modal-nova-obra")).toBeInTheDocument()
  })
})
