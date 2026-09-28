import type { DragEndEvent } from "@dnd-kit/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { createHookWrapper } from "@/test/renderWithProviders"

import { ALL_STAGES } from "../../constants/kanban"
import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { listStages, type Stage } from "../../services/stages.service"
import { deleteTarefa, getTarefas, updateTarefa } from "../../services/tarefas.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import type { Tarefa, TarefaComEtapa, TarefaStatus } from "../../types/tarefas"
import { useTarefasKanban } from "../useTarefasKanban"

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
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listarEtapas = vi.mocked(listStages)
const listarTarefas = vi.mocked(getTarefas)
const editarTarefa = vi.mocked(updateTarefa)
const excluirTarefa = vi.mocked(deleteTarefa)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function etapa(id: number, name: string): Stage {
  return {
    id,
    constructionProjectId: 7,
    name,
    description: null,
    displayOrder: id,
    status: EtapaStatus.PLANNED,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

function tarefa(id: number, status: TarefaStatus = "TODO"): Tarefa {
  return {
    id,
    title: `Tarefa ${id}`,
    description: "",
    priority: "MEDIUM",
    status,
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-03-05",
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

/** Evento de drop com o mínimo que `handleDragEnd` lê. */
function drop(over: string | null, data?: { tarefa: Tarefa; stageId: number }): DragEndEvent {
  return {
    over: over ? { id: over } : null,
    active: { id: data?.tarefa.id ?? 0, data: { current: data } },
  } as unknown as DragEndEvent
}

function item(t: Tarefa, stageId = 1): TarefaComEtapa {
  return { tarefa: t, stageId, stageName: "Fundação" }
}

function render(projectId = 7) {
  return renderHook(() => useTarefasKanban(projectId), { wrapper: createHookWrapper() })
}

/** Monta com duas etapas povoadas e espera as tarefas aparecerem. */
async function renderComTarefas() {
  listarEtapas.mockResolvedValue([etapa(1, "Fundação"), etapa(2, "Alvenaria")])
  listarTarefas.mockImplementation((id) =>
    Promise.resolve(id === 1 ? [tarefa(10), tarefa(11, "DONE")] : [tarefa(20, "IN_PROGRESS")]),
  )
  const view = render()
  await waitFor(() => expect(view.result.current.visible).toHaveLength(3))
  return view
}

beforeEach(() => {
  vi.resetAllMocks()
  listarEtapas.mockResolvedValue([])
  listarTarefas.mockResolvedValue([])
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_TASKS],
  })
  editarTarefa.mockResolvedValue(tarefa(10))
  excluirTarefa.mockResolvedValue(undefined)
})

describe("useTarefasKanban — montagem das colunas", () => {
  it("achata as tarefas de todas as etapas carregando a etapa de origem", async () => {
    const { result } = await renderComTarefas()

    expect(result.current.visible.map((i) => i.tarefa.id).sort()).toEqual([10, 11, 20])
    expect(result.current.visible.find((i) => i.tarefa.id === 20)?.stageName).toBe("Alvenaria")
  })

  it("agrupa por status", async () => {
    const { result } = await renderComTarefas()

    expect(result.current.byStatus("TODO")).toHaveLength(1)
    expect(result.current.byStatus("DONE")).toHaveLength(1)
    expect(result.current.byStatus("BLOCKED")).toHaveLength(0)
  })

  // Criar tarefa sem filtro precisa de um destino: a primeira etapa da obra.
  it("aponta a primeira etapa como destino padrão", async () => {
    const { result } = await renderComTarefas()

    expect(result.current.firstStageId).toBe(1)
  })

  it("devolve destino nulo em obra sem etapa", async () => {
    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.firstStageId).toBeNull()
  })
})

describe("useTarefasKanban — filtro por etapa", () => {
  it("começa mostrando todas as etapas", async () => {
    const { result } = await renderComTarefas()

    expect(result.current.stageFilter).toBe(ALL_STAGES)
    expect(result.current.visible).toHaveLength(3)
  })

  // O `<select>` devolve string; o id da etapa é número. Comparar sem converter
  // esvaziaria o quadro em todo filtro.
  it("filtra pelo id da etapa vindo como texto do select", async () => {
    const { result } = await renderComTarefas()

    act(() => result.current.setStageFilter("2"))

    expect(result.current.visible).toHaveLength(1)
    expect(result.current.visible[0].tarefa.id).toBe(20)
  })

  it("volta a mostrar tudo ao limpar o filtro", async () => {
    const { result } = await renderComTarefas()
    act(() => result.current.setStageFilter("2"))

    act(() => result.current.setStageFilter(ALL_STAGES))

    expect(result.current.visible).toHaveLength(3)
  })
})

describe("useTarefasKanban — arrastar entre colunas", () => {
  it("grava o novo status na etapa de origem do card", async () => {
    const { result } = await renderComTarefas()

    act(() => result.current.handleDragEnd(drop("DONE", { tarefa: tarefa(10), stageId: 1 })))

    await waitFor(() => expect(editarTarefa).toHaveBeenCalledWith(1, 10, { status: "DONE" }))
  })

  it.each([
    ["solto fora de qualquer coluna", drop(null, { tarefa: tarefa(10), stageId: 1 })],
    ["arrastado sem dados do card", drop("DONE")],
    ["solto na coluna de onde saiu", drop("TODO", { tarefa: tarefa(10, "TODO"), stageId: 1 })],
  ])("ignora o card %s", async (_caso, evento) => {
    const { result } = await renderComTarefas()

    act(() => result.current.handleDragEnd(evento))

    expect(editarTarefa).not.toHaveBeenCalled()
  })

  it("avisa quando o backend recusa a movimentação", async () => {
    editarTarefa.mockRejectedValue(new Error("Tarefa bloqueada."))
    const { result } = await renderComTarefas()

    act(() => result.current.handleDragEnd(drop("DONE", { tarefa: tarefa(10), stageId: 1 })))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tarefa bloqueada."))
  })

  it("cai na mensagem traduzida quando o erro de movimentação não tem texto", async () => {
    editarTarefa.mockRejectedValue(new Error(""))
    const { result } = await renderComTarefas()

    act(() => result.current.handleDragEnd(drop("DONE", { tarefa: tarefa(10), stageId: 1 })))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Não foi possível mover a tarefa."),
    )
  })
})

describe("useTarefasKanban — exclusão", () => {
  it("guarda o card pedido para confirmação sem chamar a API", async () => {
    const { result } = await renderComTarefas()

    act(() => result.current.requestDelete(item(tarefa(10))))

    expect(result.current.deleting?.tarefa.id).toBe(10)
    expect(excluirTarefa).not.toHaveBeenCalled()
  })

  it("desiste sem excluir quando o usuário cancela", async () => {
    const { result } = await renderComTarefas()
    act(() => result.current.requestDelete(item(tarefa(10))))

    act(() => result.current.cancelDelete())

    expect(result.current.deleting).toBeNull()
    expect(excluirTarefa).not.toHaveBeenCalled()
  })

  it("não faz nada ao confirmar sem card pendente", async () => {
    const { result } = await renderComTarefas()

    act(() => result.current.confirmDelete())

    expect(excluirTarefa).not.toHaveBeenCalled()
  })

  it("exclui o card confirmado e fecha a confirmação", async () => {
    const { result } = await renderComTarefas()
    act(() => result.current.requestDelete(item(tarefa(10))))

    act(() => result.current.confirmDelete())

    await waitFor(() => expect(excluirTarefa).toHaveBeenCalledWith(1, 10))
    await waitFor(() => expect(result.current.deleting).toBeNull())
    expect(toast.success).toHaveBeenCalledWith("Tarefa excluída.")
  })

  it("mantém a confirmação aberta quando a exclusão falha", async () => {
    excluirTarefa.mockRejectedValue(new Error("Tarefa com anexos."))
    const { result } = await renderComTarefas()
    act(() => result.current.requestDelete(item(tarefa(10))))

    act(() => result.current.confirmDelete())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tarefa com anexos."))
    expect(result.current.deleting).not.toBeNull()
  })
})

describe("useTarefasKanban — permissão", () => {
  it("libera o quadro para quem tem MANAGE_TASKS", async () => {
    const { result } = await renderComTarefas()

    await waitFor(() => expect(result.current.canMutate).toBe(true))
  })

  it("libera o quadro para o admin da plataforma mesmo sem papel na obra", async () => {
    perfil.mockResolvedValue({ ...EU, role: GlobalRole.ADMIN })
    membros.mockResolvedValue([])

    const { result } = render()

    await waitFor(() => expect(result.current.canMutate).toBe(true))
  })

  it("bloqueia quem não tem a permissão", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    const { result } = await renderComTarefas()

    await waitFor(() => expect(result.current.canMutate).toBe(false))
  })
})
