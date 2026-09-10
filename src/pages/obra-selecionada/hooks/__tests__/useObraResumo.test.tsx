import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import type { ProjectBudget } from "@/shared/types/budget"
import { createHookWrapper } from "@/test/renderWithProviders"

import { getProjectBudget } from "../../services/budget.service"
import { getEquipeMembers } from "../../services/equipes.service"
import { getRolePermissions, ProjectRole } from "../../services/projectPermissions.service"
import { listStages, type Stage } from "../../services/stages.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { useObraResumo } from "../useObraResumo"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("../../services/budget.service", () => ({
  getProjectBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  updateBudgetItem: vi.fn(),
  deleteBudgetItem: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  listExpenses: vi.fn(),
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
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listarEtapas = vi.mocked(listStages)
const buscarOrcamento = vi.mocked(getProjectBudget)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function etapa(id: number, status: EtapaStatus, displayOrder = id): Stage {
  return {
    id,
    constructionProjectId: 7,
    name: `Etapa ${id}`,
    description: null,
    displayOrder,
    status,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function membro(id: number): ConstructionProjectMember {
  return {
    id,
    constructionProjectId: 7,
    user: EU,
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

const ORCAMENTO: ProjectBudget = {
  id: 5,
  constructionProjectId: 7,
  description: null,
  plannedTotal: 200_000,
  totalSpent: 50_000,
  remaining: 150_000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [],
}

function render(plannedEndDate: string | null = null) {
  return renderHook(() => useObraResumo({ projectId: 7, plannedEndDate }), {
    wrapper: createHookWrapper(),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarEtapas.mockResolvedValue([])
  buscarOrcamento.mockResolvedValue(null)
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([])
  permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
})

/**
 * O resumo junta três fontes (etapas, orçamento, equipe) e entrega tudo já
 * derivado: a Visão geral não faz conta nenhuma. Os testes verificam a conta,
 * não o repasse.
 */
describe("useObraResumo", () => {
  it("entrega o resumo zerado de uma obra sem nada cadastrado", async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.progress).toBe(0))
    expect(result.current.atual).toBeNull()
    expect(result.current.doneCount).toBe(0)
    expect(result.current.membersCount).toBe(0)
    expect(result.current.spentPercent).toBe(0)
  })

  // A timeline desenha na ordem em que recebe: sem ordenar, uma etapa criada
  // depois apareceria fora de lugar.
  it("ordena as etapas por displayOrder, não pela ordem de criação", async () => {
    listarEtapas.mockResolvedValue([
      etapa(1, EtapaStatus.PLANNED, 3),
      etapa(2, EtapaStatus.PLANNED, 1),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.stages).toHaveLength(2))
    expect(result.current.stages.map((s) => s.id)).toEqual([2, 1])
  })

  it("calcula o andamento médio pelas etapas", async () => {
    listarEtapas.mockResolvedValue([etapa(1, EtapaStatus.DONE), etapa(2, EtapaStatus.PLANNED)])

    const { result } = render()

    await waitFor(() => expect(result.current.progress).toBe(50))
    expect(result.current.doneCount).toBe(1)
  })

  it("aponta a etapa em andamento como a atual", async () => {
    listarEtapas.mockResolvedValue([
      etapa(1, EtapaStatus.DONE),
      etapa(2, EtapaStatus.IN_PROGRESS),
      etapa(3, EtapaStatus.PLANNED),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.atual?.id).toBe(2))
  })

  it("calcula o percentual gasto do orçamento", async () => {
    buscarOrcamento.mockResolvedValue(ORCAMENTO)

    const { result } = render()

    await waitFor(() => expect(result.current.spentPercent).toBe(25))
  })

  // "Em atraso" é derivado da data, não é status do banco.
  it("conta os dias além do prazo final da obra", async () => {
    const { result } = render("2020-01-01")

    await waitFor(() => expect(result.current.projectLate).toBeGreaterThan(0))
  })

  it("não acusa atraso em obra dentro do prazo", async () => {
    const { result } = render("2099-12-31")

    await waitFor(() => expect(result.current.projectLate).toBe(0))
  })

  it("conta os membros da equipe", async () => {
    membros.mockResolvedValue([membro(1), membro(2)])

    const { result } = render()

    await waitFor(() => expect(result.current.membersCount).toBe(2))
    expect(result.current.members).toHaveLength(2)
  })
})
