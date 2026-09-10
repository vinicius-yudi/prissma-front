import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"

import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { listStages, type Stage } from "../../services/stages.service"
import { deleteTarefa, getTarefas } from "../../services/tarefas.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import type { Tarefa, TarefaStatus } from "../../types/tarefas"
import { TarefasTab } from "../TarefasTab"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("../../services/tarefas.service", () => ({
  getTarefas: vi.fn(),
  getTarefa: vi.fn(),
  createTarefa: vi.fn(),
  updateTarefa: vi.fn(),
  deleteTarefa: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
}))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
// O formulário tem teste próprio; aqui interessa com que etapa ele é aberto.
vi.mock("../TaskFormModal", () => ({
  TaskFormModal: ({
    open,
    stageId,
    tarefaToEdit,
  }: {
    open: boolean
    stageId: number | null
    tarefaToEdit?: Tarefa | null
  }) =>
    open ? (
      <div>{tarefaToEdit ? `form-editar-${tarefaToEdit.id}` : `form-criar-etapa-${stageId}`}</div>
    ) : null,
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listarEtapas = vi.mocked(listStages)
const listarTarefas = vi.mocked(getTarefas)
const excluirTarefa = vi.mocked(deleteTarefa)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

/**
 * Abaixo de `md` o kanban dá lugar à lista. A troca é por `useMediaQuery`, e
 * não por classe do Tailwind: esconder por CSS ainda montaria o `DndContext`
 * no celular, onde ele só atrapalha a rolagem. Como o jsdom devolve
 * `matches: false` por padrão, o desktop precisa ser ligado no teste.
 */
function viewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function etapa(id: number, name: string): Stage {
  return {
    id,
    constructionProjectId: 7,
    name,
    description: null,
    displayOrder: id,
    status: EtapaStatus.PLANNED,
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-04-01",
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function tarefa(id: number, title: string, status: TarefaStatus = "TODO"): Tarefa {
  return {
    id,
    title,
    description: "",
    priority: "MEDIUM",
    status,
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2099-12-31",
    assigneeUserId: null,
    assigneeName: null,
    constructionProjectId: 7,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function membro(): ConstructionProjectMember {
  return {
    id: 10,
    constructionProjectId: 7,
    user: EU,
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

function render() {
  return renderWithProviders(<TarefasTab projectId={7} />)
}

function coluna(nome: string) {
  return within(screen.getByText(nome).closest("div")!.parentElement!)
}

beforeEach(() => {
  vi.resetAllMocks()
  viewport(true)
  listarEtapas.mockResolvedValue([etapa(1, "Fundação")])
  listarTarefas.mockResolvedValue([tarefa(10, "Concretar laje")])
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_TASKS],
  })
  excluirTarefa.mockResolvedValue(undefined)
})

describe("<TarefasTab /> — estados", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listarEtapas.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4)
  })

  // As tarefas pendem das etapas: sem etapa não há onde criar tarefa, e o
  // convite precisa apontar para a causa real.
  it("explica que faltam etapas em obra sem nenhuma", async () => {
    listarEtapas.mockResolvedValue([])

    render()

    expect(await screen.findByText("Nenhuma etapa cadastrada")).toBeInTheDocument()
    expect(screen.getByText(/As tarefas pendem das etapas/)).toBeInTheDocument()
  })
})

describe("<TarefasTab /> — kanban", () => {
  it("desenha as quatro colunas do fluxo", async () => {
    render()

    await screen.findByText("Concretar laje")
    for (const nome of ["Não iniciada", "Em andamento", "Concluída", "Bloqueada"]) {
      expect(screen.getByText(nome)).toBeInTheDocument()
    }
  })

  it("põe cada tarefa na coluna do status dela", async () => {
    listarTarefas.mockResolvedValue([
      tarefa(10, "A fazer", "TODO"),
      tarefa(11, "Pronta", "DONE"),
    ])

    render()

    await screen.findByText("A fazer")
    expect(coluna("Não iniciada").getByText("A fazer")).toBeInTheDocument()
    expect(coluna("Concluída").getByText("Pronta")).toBeInTheDocument()
  })

  it("avisa quando a coluna está vazia", async () => {
    render()

    await screen.findByText("Concretar laje")
    expect(screen.getAllByText("Nenhuma tarefa aqui")).toHaveLength(3)
  })

  it("conta as tarefas visíveis", async () => {
    listarTarefas.mockResolvedValue([tarefa(10, "Uma"), tarefa(11, "Duas")])

    render()

    expect(await screen.findByText("2 tarefas")).toBeInTheDocument()
  })
})

describe("<TarefasTab /> — filtro de etapa", () => {
  beforeEach(() => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação"), etapa(2, "Alvenaria")])
    listarTarefas.mockImplementation((id) =>
      Promise.resolve(id === 1 ? [tarefa(10, "Da fundação")] : [tarefa(20, "Da alvenaria")]),
    )
  })

  it("começa com todas as etapas", async () => {
    render()

    await screen.findByText("Da fundação")
    expect(screen.getByText("Da alvenaria")).toBeInTheDocument()
  })

  it("filtra pelas tarefas da etapa escolhida", async () => {
    render()
    await screen.findByText("Da alvenaria")

    await userEvent.selectOptions(screen.getByRole("combobox"), "2")

    expect(screen.getByText("Da alvenaria")).toBeInTheDocument()
    expect(screen.queryByText("Da fundação")).not.toBeInTheDocument()
  })

  // Com o filtro ligado, criar tarefa deve nascer NA etapa filtrada — cair na
  // primeira da obra seria uma surpresa silenciosa.
  it("cria na etapa filtrada, não na primeira da obra", async () => {
    render()
    await screen.findByText("Da alvenaria")
    await userEvent.selectOptions(screen.getByRole("combobox"), "2")

    await userEvent.click(screen.getByRole("button", { name: /Nova tarefa/ }))

    expect(screen.getByText("form-criar-etapa-2")).toBeInTheDocument()
  })

  it("cria na primeira etapa quando não há filtro", async () => {
    render()
    await screen.findByText("Da fundação")

    await userEvent.click(screen.getByRole("button", { name: /Nova tarefa/ }))

    expect(screen.getByText("form-criar-etapa-1")).toBeInTheDocument()
  })
})

describe("<TarefasTab /> — celular", () => {
  it("troca o kanban pela lista abaixo de md", async () => {
    viewport(false)

    render()

    await screen.findByText("Concretar laje")
    // A lista tem as pílulas de recorte; o kanban, as colunas.
    expect(screen.getByRole("button", { name: /^Todas/ })).toBeInTheDocument()
    expect(screen.queryByText("Nenhuma tarefa aqui")).not.toBeInTheDocument()
  })
})

describe("<TarefasTab /> — edição e exclusão", () => {
  it("abre o formulário da tarefa clicada", async () => {
    render()
    await screen.findByText("Concretar laje")

    await userEvent.click(screen.getByRole("button", { name: "Editar tarefa" }))

    expect(screen.getByText("form-editar-10")).toBeInTheDocument()
  })

  it("pede confirmação antes de excluir", async () => {
    render()
    await screen.findByText("Concretar laje")

    await userEvent.click(screen.getByRole("button", { name: "Excluir tarefa" }))

    expect(screen.getByRole("heading", { name: "Excluir tarefa" })).toBeInTheDocument()
    expect(screen.getByText(/"Concretar laje"/)).toBeInTheDocument()
    expect(excluirTarefa).not.toHaveBeenCalled()
  })

  it("exclui ao confirmar", async () => {
    render()
    await screen.findByText("Concretar laje")
    await userEvent.click(screen.getByRole("button", { name: "Excluir tarefa" }))

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluirTarefa).toHaveBeenCalledWith(1, 10))
  })

  it("desiste sem excluir no cancelar", async () => {
    render()
    await screen.findByText("Concretar laje")
    await userEvent.click(screen.getByRole("button", { name: "Excluir tarefa" }))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("heading", { name: "Excluir tarefa" })).not.toBeInTheDocument()
    expect(excluirTarefa).not.toHaveBeenCalled()
  })

  it("esconde criar e as ações de quem não pode editar", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    render()

    await screen.findByText("Concretar laje")
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Nova tarefa/ })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole("button", { name: "Editar tarefa" })).not.toBeInTheDocument()
  })
})
