import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation, useOutletContext } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getProject } from "@/pages/projetos/services/projects.service"
import type { AppModule } from "@/shared/constants/access"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { ObraLayout } from "../ObraLayout"
import { ObraModuleRail } from "../components/ObraModuleRail"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => 7),
}))

const { useAccess } = await import("@/shared/hooks/useAccess")
const buscarObra = vi.mocked(getProject)
const acesso = vi.mocked(useAccess)

function mockAcesso(ocultos: AppModule[] = []) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: (m) => (ocultos.includes(m) ? "" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: () => false,
  })
}

const OBRA: Project = {
  id: 7,
  title: "Residencial Alfa",
  address: "Rua das Palmeiras, 100",
  street: "Rua das Palmeiras",
  number: "100",
  complement: null,
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  zipCode: "01001000",
  projectType: "RESIDENTIAL",
  category: "BUILDING",
  landArea: 400,
  builtArea: 250,
  status: ProjectStatus.IN_PROGRESS,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2099-12-31",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

/** Módulo filho: prova que a obra chega pelo Outlet, já carregada. */
function ModuloEspiao() {
  const project = useOutletContext<Project>()
  return <span data-testid="modulo">{project.title}</span>
}

function UrlSpy() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function render(route = "/obras/7/etapas") {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/obras/:obraId" element={<ObraLayout />}>
          <Route path="etapas" element={<ModuloEspiao />} />
          <Route path="visao-geral" element={<ModuloEspiao />} />
        </Route>
      </Routes>
      <UrlSpy />
    </>,
    { route },
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
  buscarObra.mockResolvedValue(OBRA)
})

describe("<ObraLayout />", () => {
  it("mostra o esqueleto enquanto a obra carrega", () => {
    buscarObra.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("mostra a tela de não encontrada quando a consulta falha", async () => {
    buscarObra.mockRejectedValue(new Error("404"))

    render()

    expect(await screen.findByRole("heading", { name: /não encontrada/i })).toBeInTheDocument()
  })

  it("volta para a lista pelo botão da tela de não encontrada", async () => {
    buscarObra.mockRejectedValue(new Error("404"))
    render()
    await screen.findByRole("heading", { name: /não encontrada/i })

    await userEvent.click(screen.getByRole("button", { name: /Voltar/i }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras")
  })

  it("mostra nome e status da obra no cabeçalho", async () => {
    render()

    expect(await screen.findByRole("heading", { name: "Residencial Alfa" })).toBeInTheDocument()
    expect(screen.getByText("Em andamento")).toBeInTheDocument()
  })

  // A legenda técnica é o subtítulo: código, endereço e início numa linha só.
  it("monta a legenda com código, endereço e início", async () => {
    render()

    await screen.findByRole("heading", { name: "Residencial Alfa" })
    expect(screen.getByText(/OBRA-0007/)).toBeInTheDocument()
    expect(screen.getByText(/Rua das Palmeiras/)).toBeInTheDocument()
  })

  it("omite o início da legenda quando a obra não tem data", async () => {
    buscarObra.mockResolvedValue({ ...OBRA, plannedStartDate: null })

    render()

    await screen.findByRole("heading", { name: "Residencial Alfa" })
    expect(screen.queryByText(/Início/)).not.toBeInTheDocument()
  })

  // A obra é carregada uma vez no layout e entregue pelo Outlet: nenhum módulo
  // refaz o fetch.
  it("entrega a obra ao módulo filho pelo Outlet", async () => {
    render()

    expect(await screen.findByTestId("modulo")).toHaveTextContent("Residencial Alfa")
    expect(buscarObra).toHaveBeenCalledTimes(1)
  })
})

/**
 * O passo atrás muda de destino: na Visão geral ele sai da obra; nos demais
 * módulos volta para ela. No desktop quem faz esse papel é o cartão de
 * contexto da sidebar.
 */
describe("<ObraLayout /> — passo atrás do celular", () => {
  it("volta ao módulo raiz quando está dentro de um módulo", async () => {
    render("/obras/7/etapas")
    await screen.findByRole("heading", { name: "Residencial Alfa" })

    await userEvent.click(screen.getByRole("button", { name: /Residencial Alfa/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/visao-geral")
  })

  it("sai da obra quando já está na visão geral", async () => {
    render("/obras/7/visao-geral")
    await screen.findByRole("heading", { name: "Residencial Alfa" })

    await userEvent.click(screen.getByRole("button", { name: /Obras/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras")
  })
})

/**
 * A sidebar não existe abaixo de `lg` e a barra de abas é do workspace — sem o
 * trilho não haveria como sair da Visão geral para Etapas no celular.
 */
describe("<ObraModuleRail />", () => {
  it("lista os módulos da obra apontando para a obra aberta", () => {
    renderWithProviders(<ObraModuleRail obraId={7} />, { route: "/obras/7/etapas" })

    expect(screen.getByRole("link", { name: /Visão geral/ })).toHaveAttribute(
      "href",
      "/obras/7/visao-geral",
    )
    expect(screen.getByRole("link", { name: /Etapas/ })).toHaveAttribute(
      "href",
      "/obras/7/etapas",
    )
  })

  // Mesma interseção da sidebar: módulo oculto no desktop não reaparece aqui.
  it("esconde o módulo que a matriz oculta do papel", () => {
    mockAcesso(["orcamento"])

    renderWithProviders(<ObraModuleRail obraId={7} />, { route: "/obras/7/etapas" })

    expect(screen.queryByRole("link", { name: /Orçamento/ })).not.toBeInTheDocument()
  })

  it("destaca o módulo aberto", () => {
    renderWithProviders(<ObraModuleRail obraId={7} />, { route: "/obras/7/etapas" })

    expect(screen.getByRole("link", { name: /Etapas/ })).toHaveClass("bg-gold-grad")
    expect(screen.getByRole("link", { name: /Tarefas/ })).not.toHaveClass("bg-gold-grad")
  })
})
