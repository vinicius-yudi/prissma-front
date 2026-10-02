import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { DeleteProjectModal } from "../DeleteProjectModal"
import { ProjectCard } from "../ProjectCard"
import { ProjectRow } from "../ProjectRow"
import { deleteProject, getProjectAcompanhamento } from "../../services/projects.service"
import type { ProjetoAcompanhamento } from "../../types"

vi.mock("../../services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectAcompanhamento: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const excluir = vi.mocked(deleteProject)
const acompanhamento = vi.mocked(getProjectAcompanhamento)

/**
 * Duas etapas de mesma duração: Fundação concluída e Alvenaria com 1 de 2
 * tarefas feitas. O formato é o do `AcompanhamentoResponse` do backend — sem a
 * lista de tarefas, só total e contagem por status.
 */
function progressoDaObra(over: Partial<ProjetoAcompanhamento> = {}): ProjetoAcompanhamento {
  return {
    obraId: 7,
    titulo: "Residencial Alfa",
    status: ProjectStatus.IN_PROGRESS,
    totalEtapas: 2,
    etapasConcluidas: 1,
    totalTarefas: 2,
    tarefasConcluidas: 1,
    stageStatusCounts: { PLANNED: 0, IN_PROGRESS: 1, BLOCKED: 0, DONE: 1 },
    taskStatusCounts: { TODO: 1, IN_PROGRESS: 0, BLOCKED: 0, DONE: 1 },
    etapas: [
      {
        id: 1,
        name: "Fundação",
        description: null,
        displayOrder: 1,
        status: "DONE",
        plannedStartDate: "2026-01-01",
        plannedEndDate: "2026-02-01",
        totalTarefas: 0,
        taskStatusCounts: { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 },
      },
      {
        id: 2,
        name: "Alvenaria",
        description: null,
        displayOrder: 2,
        status: "IN_PROGRESS",
        plannedStartDate: "2026-02-01",
        plannedEndDate: "2026-03-04",
        totalTarefas: 2,
        taskStatusCounts: { TODO: 1, IN_PROGRESS: 0, BLOCKED: 0, DONE: 1 },
      },
    ],
    ...over,
  }
}

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
const AGORA = new Date(2026, 5, 15, 12)

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
  beforeEach(() => {
    acompanhamento.mockResolvedValue(progressoDaObra())
  })

  it("mostra título, endereço e área construída", async () => {
    render()

    expect(screen.getByText("Residencial Alfa")).toBeInTheDocument()
    expect(screen.getByText("Rua das Palmeiras, 100")).toBeInTheDocument()
    expect(screen.getByText("250 m² construídos")).toBeInTheDocument()
  })

  // O avanço vem das etapas e tarefas, não do calendário: Fundação 100% e
  // Alvenaria 50%, com o mesmo peso de duração.
  it("mostra o avanço físico e a etapa atual", async () => {
    render()

    expect(await screen.findByText("75%")).toBeInTheDocument()
    expect(screen.getByText("Alvenaria")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75")
  })

  it("mostra um traço antes de o acompanhamento chegar", () => {
    acompanhamento.mockReturnValue(new Promise(() => {}))
    render()

    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.getByText("Sem etapas")).toBeInTheDocument()
  })

  // Alvenaria passou do prazo (04/03) sem concluir; Fundação já terminou.
  it("conta as etapas atrasadas", async () => {
    render()

    expect(await screen.findByTitle("1 etapa atrasada")).toHaveTextContent("1")
  })

  // Datas fixas: o relógio está congelado em 15/06/2026.
  it.each([
    ["dias restantes", { plannedEndDate: "2026-07-15" }, "30 dias restantes"],
    ["termina hoje", { plannedEndDate: "2026-06-15" }, "Termina hoje"],
    ["além do prazo", { plannedEndDate: "2026-06-12" }, "3 dias além do prazo"],
    ["entregue", { status: ProjectStatus.COMPLETED }, "Entregue"],
    ["cancelada", { status: ProjectStatus.CANCELLED }, "Cancelado"],
    ["sem prazo", { plannedEndDate: null }, "Sem prazo"],
  ] as [string, Partial<Project>, string][])("fala do prazo: %s", (_caso, over, texto) => {
    render(obra(over))

    expect(screen.getByText(texto)).toBeInTheDocument()
  })

  it("marca o atraso no pill de status", () => {
    render(obra({ plannedEndDate: "2026-06-01" }))

    expect(screen.getByText("Em atraso")).toBeInTheDocument()
  })

  it("abre a visão geral da obra", async () => {
    render()

    await userEvent.click(screen.getByRole("link"))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/visao-geral")
  })

  // Muito atrás do esperado para hoje, o percentual vira alerta.
  it("pinta o percentual de perigo quando a obra está atrás do esperado", async () => {
    acompanhamento.mockResolvedValue(progressoDaObra({ etapas: [] }))
    render(obra({ plannedStartDate: "2026-01-01", plannedEndDate: "2026-07-01" }))

    expect(await screen.findByText("0%")).toHaveClass("text-danger")
  })
})

describe("<ProjectRow />", () => {
  it("mostra a obra em linha com avanço, prazo e status", async () => {
    acompanhamento.mockResolvedValue(progressoDaObra())
    renderWithProviders(<ProjectRow project={obra({ plannedEndDate: "2026-07-15" })} />)

    expect(await screen.findByText("75%")).toBeInTheDocument()
    expect(screen.getByText("30 dias restantes")).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "/obras/7/visao-geral")
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
