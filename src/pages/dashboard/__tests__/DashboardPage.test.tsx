import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { listProjects } from "@/pages/projetos/services/projects.service"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { DashboardPage } from "../index"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

const listar = vi.mocked(listProjects)

function obra(id: number, title: string, status: ProjectStatus): Project {
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
    status,
    plannedStartDate: "2026-01-01",
    plannedEndDate: "2026-12-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function UrlSpy() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function render() {
  return renderWithProviders(
    <>
      <DashboardPage />
      <UrlSpy />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
})

describe("<DashboardPage />", () => {
  it("mostra o título da tela", () => {
    render()

    expect(screen.getByRole("heading", { name: "Painel de Controle" })).toBeInTheDocument()
  })

  // Traço no lugar do número enquanto carrega: um zero piscando lê como "não
  // há obra nenhuma".
  it("mostra um traço no contador antes de os dados chegarem", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    render()

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("conta as obras visíveis ao usuário", async () => {
    listar.mockResolvedValue([
      obra(1, "Alfa", ProjectStatus.IN_PROGRESS),
      obra(2, "Beta", ProjectStatus.COMPLETED),
    ])

    render()

    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("leva para a lista de obras pelo card de contagem", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: /PROJETOS ATIVOS/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras")
  })

  /**
   * Os dois cards ao lado são **valores fixos** — não há endpoint por trás.
   * Ficam explícitos na constante em vez de disfarçados no JSX.
   */
  it("mostra os dois cards de valor fixo", () => {
    render()

    expect(screen.getByText("TAREFAS PENDENTES")).toBeInTheDocument()
    expect(screen.getByText("14")).toBeInTheDocument()
    expect(screen.getByText("PRÓXIMAS VISITAS")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("mostra o esqueleto da lista enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2)
  })

  it("avisa quando nenhuma obra está em andamento", async () => {
    listar.mockResolvedValue([obra(1, "Beta", ProjectStatus.COMPLETED)])

    render()

    expect(
      await screen.findByText("Nenhum projeto em andamento no momento."),
    ).toBeInTheDocument()
  })

  // A lista da Home é só das obras tocando: concluída conta no total, mas não
  // aparece nos cards.
  it("lista apenas as obras em andamento", async () => {
    listar.mockResolvedValue([
      obra(1, "Alfa", ProjectStatus.IN_PROGRESS),
      obra(2, "Beta", ProjectStatus.COMPLETED),
    ])

    render()

    expect(await screen.findByRole("heading", { name: "Alfa" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Beta" })).not.toBeInTheDocument()
  })
})
