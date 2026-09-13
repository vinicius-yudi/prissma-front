import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { DeleteProjectModal } from "../DeleteProjectModal"
import { ProjectCard } from "../ProjectCard"
import { ProjectsFilter } from "../ProjectsFilter"
import { ProjectFilter } from "../../types"
import { deleteProject } from "../../services/projects.service"

vi.mock("../../services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const excluir = vi.mocked(deleteProject)

/**
 * Datas relativas a hoje — o card fala em "dias restantes".
 *
 * Montada com os campos LOCAIS, nunca com `toISOString()`: em fuso negativo o
 * ISO devolve a data UTC, que depois das 21h já é o dia seguinte, e "hoje"
 * viraria "amanhã" só por causa da hora em que a suíte rodou.
 */
function emDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mes}-${dia}`
}

function obra(over: Partial<Project> = {}): Project {
  return {
    id: 7,
    title: "Residencial Alfa",
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

function UrlSpy() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function render(project = obra()) {
  return renderWithProviders(
    <>
      <ProjectCard project={project} />
      <UrlSpy />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </>,
  )
}

/**
 * Relógio congelado: `dateProgress` é contínuo dentro do dia, então o
 * `aria-valuenow` do card muda conforme a hora em que a suíte roda — estes
 * testes passavam de manhã e falhavam à tarde. O instante é UTC de propósito:
 * a janela do teste de progresso é comparada em instantes absolutos, e só assim
 * o valor esperado independe do fuso da máquina.
 *
 * `shouldAdvanceTime` mantém o `userEvent` funcionando com timers falsos.
 */
const AGORA = new Date("2026-06-15T00:00:00Z")

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(AGORA)
  vi.resetAllMocks()
  excluir.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("<ProjectCard />", () => {
  it("mostra título, endereço, tipo e área construída", () => {
    render()

    expect(screen.getByRole("heading", { name: "Residencial Alfa" })).toBeInTheDocument()
    expect(screen.getByText("Rua das Palmeiras, 100")).toBeInTheDocument()
    expect(screen.getByText("Residencial")).toBeInTheDocument()
    expect(screen.getByText("250 m² construído")).toBeInTheDocument()
  })

  it("mostra um traço no lugar das datas ausentes", () => {
    render(obra({ plannedStartDate: null, plannedEndDate: null }))

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
  })

  // O progresso é aproximação por tempo decorrido — o backend ainda não expõe
  // percentual executado.
  // Janela escrita à mão, e não com `emDias`: `dateProgress` compara instantes
  // absolutos, então o ponto médio exato só é o mesmo em todo fuso se as duas
  // pontas e o "agora" forem UTC. 16/05 → 15/07 são 60 dias; AGORA é o dia 30.
  it("estima o progresso pela janela planejada", () => {
    render(obra({ plannedStartDate: "2026-05-16", plannedEndDate: "2026-07-15" }))

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50")
  })

  it("zera o progresso sem janela planejada", () => {
    render(obra({ plannedStartDate: null, plannedEndDate: null }))

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")
  })

  /**
   * O rodapé responde "quanto falta" — e cada estado terminal tem sua palavra:
   * concluída e cancelada não contam dias, e prazo vencido é urgência, não
   * número negativo.
   */
  // As obras vêm em fábrica, não prontas: o array do `it.each` é avaliado na
  // coleta, antes do `beforeEach`, e as datas nasceriam com o relógio real.
  it.each([
    ["conta os dias restantes", () => obra(), /dias restantes/],
    ["avisa que vence hoje", () => obra({ plannedEndDate: emDias(0) }), /Vence hoje/],
    ["avisa prazo vencido", () => obra({ plannedEndDate: emDias(-5) }), /Prazo vencido/],
    ["diz concluído", () => obra({ status: ProjectStatus.COMPLETED }), /^Concluído$/],
    ["diz cancelado", () => obra({ status: ProjectStatus.CANCELLED }), /^Cancelado$/],
  ])("%s", (_caso, criarObra, esperado) => {
    render(criarObra())

    expect(screen.getByText(esperado)).toBeInTheDocument()
  })

  // Data pura vinda do backend não pode escorregar um dia na exibição: lida
  // como meia-noite UTC, 16/05 aparecia como 15/05 em qualquer fuso negativo.
  it("mostra a data planejada no dia certo", () => {
    render(obra({ plannedStartDate: "2026-05-16", plannedEndDate: "2026-07-15" }))

    expect(screen.getByText("16/05/2026")).toBeInTheDocument()
    expect(screen.getByText("15/07/2026")).toBeInTheDocument()
  })

  it("mostra o traço quando não há prazo final", () => {
    render(obra({ plannedEndDate: null }))

    expect(screen.getAllByText("—").length).toBeGreaterThan(0)
  })

  it("marca o atraso no badge de status", () => {
    render(obra({ plannedEndDate: emDias(-5) }))

    expect(screen.getByText("Em atraso")).toBeInTheDocument()
  })

  // Editar e excluir moram na Visão geral: no card eles surgiam no hover sobre
  // o mesmo alvo do clique de abrir.
  it("abre a visão geral da obra ao clicar no card", async () => {
    render()

    await userEvent.click(screen.getByRole("heading", { name: "Residencial Alfa" }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/visao-geral")
  })
})

describe("<ProjectsFilter />", () => {
  const stats = { total: 10, inProgress: 4, completed: 3, overdue: 2 }
  const onFilter = vi.fn()

  it("mostra as quatro pílulas com as contagens", () => {
    renderWithProviders(
      <ProjectsFilter filter={ProjectFilter.ALL} onFilter={onFilter} stats={stats} />,
    )

    expect(screen.getByRole("button", { name: /Todos/ })).toHaveTextContent("10")
    expect(screen.getByRole("button", { name: /Em Andamento/ })).toHaveTextContent("4")
    expect(screen.getByRole("button", { name: /Concluídos/ })).toHaveTextContent("3")
    expect(screen.getByRole("button", { name: /Atrasados/ })).toHaveTextContent("2")
  })

  it("avisa o recorte escolhido", async () => {
    renderWithProviders(
      <ProjectsFilter filter={ProjectFilter.ALL} onFilter={onFilter} stats={stats} />,
    )

    await userEvent.click(screen.getByRole("button", { name: /Atrasados/ }))

    expect(onFilter).toHaveBeenCalledWith(ProjectFilter.OVERDUE)
  })

  it("destaca a pílula ativa", () => {
    renderWithProviders(
      <ProjectsFilter filter={ProjectFilter.COMPLETED} onFilter={onFilter} stats={stats} />,
    )

    expect(screen.getByRole("button", { name: /Concluídos/ })).toHaveClass("bg-gold-grad")
    expect(screen.getByRole("button", { name: /Todos/ })).not.toHaveClass("bg-gold-grad")
  })
})

describe("<DeleteProjectModal />", () => {
  const onClose = vi.fn()
  const onDeleted = vi.fn()

  it("fica fechado sem obra", () => {
    renderWithProviders(
      <DeleteProjectModal project={null} onClose={onClose} onDeleted={onDeleted} />,
    )

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  // O nome no texto é o que evita excluir a obra errada com o modal aberto por
  // engano na linha de cima.
  it("cita o nome da obra na confirmação", () => {
    renderWithProviders(
      <DeleteProjectModal project={obra()} onClose={onClose} onDeleted={onDeleted} />,
    )

    expect(screen.getByText(/"Residencial Alfa"/)).toBeInTheDocument()
  })

  it("exclui ao confirmar e avisa quem abriu", async () => {
    renderWithProviders(
      <DeleteProjectModal project={obra()} onClose={onClose} onDeleted={onDeleted} />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    // `mutationFn: deleteProject` recebe o contexto da mutation no 2º
    // argumento; só o primeiro é do domínio.
    await waitFor(() => expect(excluir).toHaveBeenCalled())
    expect(excluir.mock.calls[0][0]).toBe(7)
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()
  })

  it("fecha sem excluir no cancelar", async () => {
    renderWithProviders(
      <DeleteProjectModal project={obra()} onClose={onClose} onDeleted={onDeleted} />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onClose).toHaveBeenCalled()
    expect(excluir).not.toHaveBeenCalled()
  })
})
