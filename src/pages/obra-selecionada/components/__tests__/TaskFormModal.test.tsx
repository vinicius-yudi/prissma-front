import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { GlobalRole, type Role } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"

import { getEquipeMembers } from "../../services/equipes.service"
import type { Stage } from "../../services/stages.service"
import { createTarefa, getTarefas, updateTarefa } from "../../services/tarefas.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import type { Tarefa } from "../../types/tarefas"
import { TaskFormModal } from "../TaskFormModal"

vi.mock("../../services/tarefas.service", () => ({
  getTarefas: vi.fn(),
  getTarefa: vi.fn(),
  createTarefa: vi.fn(),
  updateTarefa: vi.fn(),
  deleteTarefa: vi.fn(),
}))
vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const criar = vi.mocked(createTarefa)
const editar = vi.mocked(updateTarefa)
const membros = vi.mocked(getEquipeMembers)

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: null,
    displayOrder: 1,
    status: EtapaStatus.PLANNED,
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-04-01",
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function tarefa(over: Partial<Tarefa> = {}): Tarefa {
  return {
    id: 9,
    title: "Concretar laje",
    description: "Concreto usinado",
    priority: "HIGH",
    status: "IN_PROGRESS",
    plannedStartDate: "2026-03-05",
    plannedEndDate: "2026-03-10",
    assigneeUserId: 2,
    assigneeName: "Bia Lima",
    constructionProjectId: 7,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function membro(id: number, nome: string, role: Role = GlobalRole.ENG): ConstructionProjectMember {
  return {
    id: id * 10,
    constructionProjectId: 7,
    user: { id, name: nome, email: `${id}@alfa.com`, role },
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

const onClose = vi.fn()
const onSaved = vi.fn()

interface Opts {
  stageId?: number | null
  stages?: Stage[]
  tarefaToEdit?: Tarefa | null
  canMutate?: boolean
}

function render({ stageId = 1, stages = [etapa()], tarefaToEdit, canMutate = true }: Opts = {}) {
  return renderWithProviders(
    <TaskFormModal
      open
      onClose={onClose}
      stageId={stageId}
      stages={stages}
      projectId={7}
      canMutate={canMutate}
      tarefaToEdit={tarefaToEdit}
      onSaved={onSaved}
    />,
  )
}

/** Selects na ordem em que aparecem: etapa, status, prioridade, responsável. */
function selects(): HTMLSelectElement[] {
  return screen.getAllByRole("combobox") as HTMLSelectElement[]
}

/** Datas na ordem: início e término planejados. */
function datas(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]'))
}

/** Preenche o mínimo que o schema exige. Título e descrição, nessa ordem. */
async function preencherMinimo(inicio = "2026-03-05", fim = "2026-03-10") {
  const [titulo, descricao] = screen.getAllByRole("textbox")
  await userEvent.type(titulo, "Concretar laje")
  await userEvent.type(descricao, "Concreto usinado")
  await userEvent.type(datas()[0], inicio)
  await userEvent.type(datas()[1], fim)
  await userEvent.selectOptions(selects()[3], "2")
}

function salvar() {
  return userEvent.click(screen.getByRole("button", { name: "Salvar" }))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getTarefas).mockResolvedValue([])
  membros.mockResolvedValue([membro(2, "Bia Lima")])
  criar.mockResolvedValue(tarefa())
  editar.mockResolvedValue(tarefa())
})

describe("<TaskFormModal /> — abertura", () => {
  it("não renderiza nada fechado", () => {
    renderWithProviders(
      <TaskFormModal
        open={false}
        onClose={onClose}
        stageId={1}
        stages={[etapa()]}
        projectId={7}
      />,
    )

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("abre em branco para criar, já na etapa recebida", async () => {
    render()

    expect(screen.getByRole("heading", { name: "Criar tarefa" })).toBeInTheDocument()
    expect(selects()[0]).toHaveValue("1")
  })

  it("abre preenchida para editar", async () => {
    render({ tarefaToEdit: tarefa() })

    expect(screen.getByRole("heading", { name: "Editar tarefa" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Concretar laje")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Concreto usinado")).toBeInTheDocument()
  })

  // A tarefa pende da etapa: mudar de etapa numa tarefa existente seria mover
  // o recurso de coleção, o que a API não faz por PATCH.
  it("trava a etapa ao editar", () => {
    render({ tarefaToEdit: tarefa() })

    expect(selects()[0]).toBeDisabled()
  })

  it("lista as etapas com a ordem no rótulo", () => {
    render({ stages: [etapa(), etapa({ id: 2, name: "Alvenaria", displayOrder: 2 })] })

    expect(screen.getByRole("option", { name: "1. Fundação" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "2. Alvenaria" })).toBeInTheDocument()
  })

  /**
   * Só colaborador técnico (engenheiro/arquiteto) pode ser responsável:
   * cliente não executa tarefa, e ADMIN é staff da plataforma, não equipe.
   */
  it("oferece como responsável só os colaboradores da obra", async () => {
    membros.mockResolvedValue([
      membro(2, "Bia Lima", GlobalRole.ENG),
      membro(3, "Caio Reis", GlobalRole.ARQ),
      membro(4, "Cliente Alfa", GlobalRole.USER),
      membro(5, "Staff", GlobalRole.ADMIN),
    ])

    render()

    expect(await screen.findByRole("option", { name: "Bia Lima" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Caio Reis" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Cliente Alfa" })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Staff" })).not.toBeInTheDocument()
  })

  it("deixa tudo em leitura para quem não pode editar", () => {
    render({ canMutate: false, tarefaToEdit: tarefa() })

    expect(screen.getByDisplayValue("Concretar laje")).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument()
  })

  // O campo de início não deixa escolher antes do começo da etapa; a
  // validação no submit é a rede de segurança para quem digita a data.
  it("limita o início ao começo da etapa", () => {
    render()

    expect(datas()[0]).toHaveAttribute("min", "2026-03-01")
  })
})

describe("<TaskFormModal /> — gravação", () => {
  it("cria a tarefa na etapa selecionada", async () => {
    render()

    await preencherMinimo()
    await salvar()

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toBe(1)
    expect(criar.mock.calls[0][1]).toMatchObject({
      title: "Concretar laje",
      assigneeUserId: 2,
      plannedStartDate: "2026-03-05",
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("edita pela rota da própria tarefa", async () => {
    render({ tarefaToEdit: tarefa() })

    await salvar()

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0].slice(0, 2)).toEqual([1, 9])
    expect(onSaved).toHaveBeenCalled()
  })

  it("avisa por toast quando o formulário é submetido inválido", async () => {
    render()

    await salvar()

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(criar).not.toHaveBeenCalled()
  })

  it("mantém o modal aberto quando a gravação falha", async () => {
    criar.mockRejectedValue(new Error("Erro 500"))
    render()

    await preencherMinimo()
    await salvar()

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it("fecha no cancelar sem gravar", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onClose).toHaveBeenCalled()
    expect(criar).not.toHaveBeenCalled()
  })
})

/**
 * Três recusas distintas antes de chamar a API — cada uma aponta o que
 * corrigir. Um 400 do backend diria só "requisição inválida".
 */
describe("<TaskFormModal /> — vínculo com a etapa", () => {
  it("recusa tarefa sem etapa vinculada", async () => {
    render({ stageId: null })

    await preencherMinimo()
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Selecione uma etapa para vincular à tarefa."),
    )
    expect(criar).not.toHaveBeenCalled()
  })

  it("recusa quando a etapa vinculada não tem data de início", async () => {
    render({ stages: [etapa({ plannedStartDate: null })] })

    await preencherMinimo()
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("A etapa vinculada precisa ter uma data de início."),
    )
    expect(criar).not.toHaveBeenCalled()
  })

  /**
   * O `min` do campo é a primeira barreira: o navegador (e o jsdom) barram o
   * submit por rangeUnderflow antes de o handler rodar. A checagem em
   * `onSubmit` fica como rede de segurança para o que passar por ali.
   */
  it("nem chega a submeter uma data anterior ao início da etapa", async () => {
    render({ stages: [etapa({ plannedStartDate: "2026-06-01" })] })

    await preencherMinimo("2026-03-05", "2026-03-10")
    await salvar()

    expect(criar).not.toHaveBeenCalled()
  })

  // A validação lê a etapa ESCOLHIDA no seletor, não a que abriu o modal.
  it("valida contra a etapa escolhida no seletor, não contra a inicial", async () => {
    render({
      stages: [etapa(), etapa({ id: 2, name: "Alvenaria", plannedStartDate: null })],
    })

    await userEvent.selectOptions(selects()[0], "2")
    await preencherMinimo()
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("A etapa vinculada precisa ter uma data de início."),
    )
    expect(criar).not.toHaveBeenCalled()
  })
})
