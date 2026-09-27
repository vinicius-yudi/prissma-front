import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getProjectAcompanhamento, updateProject } from "@/pages/projetos/services/projects.service"
import type { ProjetoAcompanhamento } from "@/pages/projetos/types"
import type { ProjectBudget } from "@/shared/types/budget"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { paceOf } from "../../hooks/useObraHeader"
import { getProjectBudget } from "../../services/budget.service"
import { ganttScale } from "../gantt/ganttScale"
import { ObraView } from "../ObraView"
import { VisaoGeral } from "../visao-geral/VisaoGeral"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  getProjectAcompanhamento: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  createProject: vi.fn(),
}))
vi.mock("../../services/budget.service", () => ({ getProjectBudget: vi.fn() }))
vi.mock("../../hooks/useObraMembers", () => ({
  useObraMembers: () => ({
    members: [],
    list: [
      { id: 1, user: { name: "Marina Kowalski" }, roleInProject: "OWNER" },
      { id: 2, user: { name: "Rafael Torres" }, roleInProject: "ARCHITECT" },
    ],
    count: 2,
    isLoading: false,
    isError: false,
  }),
  obraMembersKey: (id: number) => ["equipes", id],
}))
const podeGerenciar = vi.fn(() => true)
vi.mock("../../hooks/useProjectPermissions", () => ({
  useProjectPermissions: () => ({ isAdmin: false, roleInProject: "OWNER", isLoading: false, can: () => podeGerenciar() }),
}))
vi.mock("../../hooks/useDiario", () => ({
  useDiario: () => ({
    entries: [
      { id: 1, entryType: "IMPEDIMENT", entryDate: "2026-06-14T10:00:00Z", description: "Chuva parou a concretagem" },
      { id: 2, entryType: "DELIVERY", entryDate: "2026-06-13T10:00:00Z", description: "Chegou o aço" },
    ],
  }),
}))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: () => ({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: () => "w",
    canSee: () => true,
    isReadOnly: () => false,
  }),
  useCurrentModule: () => null,
  useObraIdFromPath: () => 7,
}))
vi.mock("../DocumentosRecentes", () => ({ DocumentosRecentes: () => <span>documentos-recentes</span> }))
vi.mock("@/pages/projetos/components/ProjectStepModal", () => ({
  ProjectStepModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <button onClick={onClose}>modal-editar</button> : null,
}))
vi.mock("@/pages/projetos/components/DeleteProjectModal", () => ({
  DeleteProjectModal: ({ project, onClose, onDeleted }: { project: unknown; onClose: () => void; onDeleted: () => void }) =>
    project ? (
      <>
        <button onClick={onClose}>fechar-excluir</button>
        <button onClick={onDeleted}>confirmar-excluir</button>
      </>
    ) : null,
}))
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-toastify")>()),
  toast: { success: vi.fn(), error: vi.fn() },
}))

const acompanhamento = vi.mocked(getProjectAcompanhamento)
const orcamento = vi.mocked(getProjectBudget)
const atualizar = vi.mocked(updateProject)

/** Relógio congelado em 15/06/2026, meio-dia. */
const AGORA = new Date(2026, 5, 15, 12)

const OBRA: Project = {
  id: 7,
  title: "Residência Mercês",
  address: "Rua Padre Anchieta, 2355",
  street: "Rua Padre Anchieta",
  number: "2355",
  complement: null,
  neighborhood: "Mercês",
  city: "Curitiba",
  state: "PR",
  zipCode: "80410030",
  projectType: "RESIDENTIAL",
  category: "BUILDING",
  landArea: 360,
  builtArea: 280,
  status: ProjectStatus.IN_PROGRESS,
  plannedStartDate: "2026-01-01",
  plannedEndDate: "2026-12-31",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

/** Fundação concluída; Alvenaria em andamento e já vencida (fim em 01/06). */
const ACOMPANHAMENTO: ProjetoAcompanhamento = {
  obraId: 7,
  titulo: "Residência Mercês",
  status: ProjectStatus.IN_PROGRESS,
  totalEtapas: 2,
  etapasConcluidas: 1,
  totalTarefas: 4,
  tarefasConcluidas: 2,
  stageStatusCounts: {},
  taskStatusCounts: {},
  etapas: [
    {
      id: 1,
      name: "Fundação",
      description: null,
      displayOrder: 1,
      status: "DONE",
      plannedStartDate: "2026-01-05",
      plannedEndDate: "2026-02-28",
      totalTarefas: 2,
      taskStatusCounts: { DONE: 2 },
    },
    {
      id: 2,
      name: "Alvenaria",
      description: "Paredes do térreo",
      displayOrder: 2,
      status: "IN_PROGRESS",
      plannedStartDate: "2026-03-01",
      plannedEndDate: "2026-06-01",
      totalTarefas: 2,
      taskStatusCounts: { TODO: 2 },
    },
  ],
}

const ORCAMENTO: ProjectBudget = {
  id: 1,
  constructionProjectId: 7,
  description: null,
  plannedTotal: 100000,
  totalSpent: 60000,
  remaining: 40000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [
    { id: 1, projectBudgetId: 1, category: "Marcenaria", description: "", plannedAmount: 10000, totalSpent: 14040, remaining: -4040, exceeded: true },
    { id: 2, projectBudgetId: 1, category: "Elétrica", description: "", plannedAmount: 20000, totalSpent: 18000, remaining: 2000, exceeded: false },
    { id: 3, projectBudgetId: 1, category: "Pintura", description: "", plannedAmount: 20000, totalSpent: 0, remaining: 20000, exceeded: false },
  ],
}

function Url() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function renderObra(route = "/obras/7/visao-geral", project = OBRA) {
  const isVisaoGeral = route.endsWith("visao-geral")
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/obras/:obraId" element={<ObraView project={project} isVisaoGeral={isVisaoGeral} />}>
          <Route path="visao-geral" element={<VisaoGeral project={project} />} />
          <Route path="etapas" element={<span>etapas</span>} />
        </Route>
      </Routes>
      <Url />
    </>,
    { route },
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(AGORA)
  vi.clearAllMocks()
  podeGerenciar.mockReturnValue(true)
  acompanhamento.mockResolvedValue(ACOMPANHAMENTO)
  orcamento.mockResolvedValue(ORCAMENTO)
  atualizar.mockResolvedValue(OBRA)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("cabeçalho da obra", () => {
  it("mostra o cabeçalho grande com avanço, ritmo, prazo e orçamento", async () => {
    renderObra()

    expect(screen.getByRole("heading", { level: 1, name: "Residência Mercês" })).toBeInTheDocument()
    // Fundação 100% (55 dias) e Alvenaria 0% (92 dias): 37% ponderado.
    expect(await screen.findByLabelText("37")).toBeInTheDocument()
    expect(screen.getByText(/pontos abaixo do esperado/)).toBeInTheDocument()
    expect(screen.getByText("60% utilizado")).toBeInTheDocument()
    expect(screen.getByText("2 pessoas na obra")).toBeInTheDocument()
  })

  it("encolhe para a barra compacta nos módulos", async () => {
    renderObra("/obras/7/etapas")

    expect(screen.getByRole("heading", { level: 1, name: "Residência Mercês" })).toBeInTheDocument()
    expect(await screen.findByText("37%")).toBeInTheDocument()
    expect(screen.getByText("Mercês, Curitiba")).toBeInTheDocument()
    expect(screen.queryByText(/OBRA-0007/)).not.toBeInTheDocument()
  })

  // Toda ação volta atrás: trocar o status gera toast com Desfazer.
  it("troca o status pelo menu, com PATCH só do status", async () => {
    const { toast } = await import("react-toastify")
    renderObra()

    await userEvent.click(screen.getByRole("button", { name: "Trocar status da obra" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Pausada" }))

    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(7, { status: "PAUSED" }))
    expect(toast.success).toHaveBeenCalled()
  })

  it("desfaz a troca de status pelo toast, sem gerar outro Desfazer", async () => {
    const { toast } = await import("react-toastify")
    renderObra()

    await userEvent.click(screen.getByRole("button", { name: "Trocar status da obra" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Pausada" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))

    const mensagem = vi.mocked(toast.success).mock.calls[0][0] as { props: { action: { onClick: () => void } } }
    mensagem.props.action.onClick()

    await waitFor(() => expect(atualizar).toHaveBeenLastCalledWith(7, { status: "IN_PROGRESS" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2))
    expect(typeof vi.mocked(toast.success).mock.calls[1][0]).toBe("string")
  })

  it("avisa quando a troca de status falha e ignora escolher o mesmo status", async () => {
    const { toast } = await import("react-toastify")
    atualizar.mockRejectedValue(new Error("Sem permissão"))
    renderObra()

    await userEvent.click(screen.getByRole("button", { name: "Trocar status da obra" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Em andamento" }))
    expect(atualizar).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole("button", { name: "Trocar status da obra" }))
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Trocar status da obra" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Concluída" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sem permissão"))
  })

  it("abre editar e excluir e volta para a lista ao excluir", async () => {
    renderObra()

    await userEvent.click(screen.getByRole("button", { name: /Editar obra/ }))
    await userEvent.click(screen.getByRole("button", { name: "modal-editar" }))
    expect(screen.queryByText("modal-editar")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }))
    await userEvent.click(screen.getByRole("button", { name: "fechar-excluir" }))
    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }))
    await userEvent.click(screen.getByRole("button", { name: "confirmar-excluir" }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras")
  })

  it("mostra contagens e alertas nas abas", async () => {
    renderObra()

    const abas = within(screen.getByRole("navigation", { name: "Seções da obra" }))
    const etapas = await abas.findByRole("link", { name: /Etapas/ })
    expect(etapas).toHaveTextContent("2")
    expect(etapas.querySelector(".bg-danger")).toBeInTheDocument()
    expect(abas.getByRole("link", { name: /Orçamento/ }).querySelector(".bg-danger")).toBeInTheDocument()
  })
})

describe("cabeçalho para quem só acompanha", () => {
  // Sem MANAGE_PROJECT: status é só leitura e editar/excluir somem.
  it("mostra o status sem menu e sem editar ou excluir", async () => {
    podeGerenciar.mockReturnValue(false)
    renderObra()

    expect(await screen.findByText("Em atraso")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Trocar status da obra" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Editar obra/ })).not.toBeInTheDocument()
  })

  it("não mostra a etapa atual nem o ritmo em obra concluída", async () => {
    renderObra("/obras/7/visao-geral", { ...OBRA, status: ProjectStatus.COMPLETED })

    expect(await screen.findByLabelText("37")).toBeInTheDocument()
    expect(screen.queryByText(/Etapa atual/)).not.toBeInTheDocument()
    expect(screen.queryByText(/abaixo do esperado/)).not.toBeInTheDocument()
  })
})

describe("visão geral", () => {
  it("lista o que precisa de decisão, com o tamanho do problema", async () => {
    renderObra()

    expect(await screen.findByRole("link", { name: /Etapa Alvenaria/ })).toHaveAttribute("href", "/obras/7/etapas")
    expect(screen.getByText("14 dias de atraso")).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?4\.040,00 além de R\$\s?10\.000,00/)).toBeInTheDocument()
    expect(screen.getByText("Elétrica perto do limite")).toBeInTheDocument()
  })

  it("desenha o cronograma e leva às etapas pelo clique", async () => {
    renderObra()

    const barra = await screen.findByRole("button", { name: /Alvenaria: .*Em atraso/ })
    await userEvent.click(barra)

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/etapas")
  })

  it("mostra a etapa atual, orçamento, equipe e diário", async () => {
    renderObra()

    expect(await screen.findByText("Etapa atual · 02 de 02")).toBeInTheDocument()
    expect(screen.getByText("0 de 2 tarefas concluídas")).toBeInTheDocument()
    expect(screen.getByText("Saldo")).toBeInTheDocument()
    expect(screen.getByText("Rafael Torres")).toBeInTheDocument()
    expect(screen.getByText("Chuva parou a concretagem")).toBeInTheDocument()
    expect(screen.getByText("documentos-recentes")).toBeInTheDocument()
  })

  it("diz que está tudo em dia sem alertas e sem orçamento", async () => {
    acompanhamento.mockResolvedValue({ ...ACOMPANHAMENTO, etapas: [ACOMPANHAMENTO.etapas[0]] })
    orcamento.mockResolvedValue(null)

    renderObra()

    expect(await screen.findByText("Tudo dentro do prazo e do orçamento.")).toBeInTheDocument()
    expect(screen.getByText("Nenhum orçamento cadastrado.")).toBeInTheDocument()
  })
})

describe("regras do cabeçalho e do cronograma", () => {
  it.each([
    [50, 52, "onTrack"],
    [60, 50, "ahead"],
    [46, 50, "behind"],
    [30, 50, "late"],
  ] as const)("com %i%% real e %i%% esperado, o ritmo é %s", (real, esperado, tom) => {
    expect(paceOf(real, esperado).tone).toBe(tom)
  })

  it("não monta régua sem etapas com datas", () => {
    expect(ganttScale([{ plannedStartDate: null, plannedEndDate: null }])).toBeNull()
  })

  it("marca cada virada de mês dentro do intervalo", () => {
    const scale = ganttScale([{ plannedStartDate: "2026-01-10", plannedEndDate: "2026-03-20" }], AGORA)

    expect(scale?.months.map((m) => m.date.getMonth())).toEqual([1, 2, 3, 4, 5])
    expect(scale?.today).toBeGreaterThan(0)
  })
})
