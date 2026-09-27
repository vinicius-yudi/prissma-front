import type { DragEndEvent } from "@dnd-kit/core"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getProjectAcompanhamento } from "@/pages/projetos/services/projects.service"
import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { ProjectStatus } from "@/shared/types/project"
import { GlobalRole } from "@/shared/types/user"
import type { Attachment } from "@/shared/types/attachment"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listAttachments } from "../../services/attachments.service"
import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import {
  deleteStage,
  listStages,
  reorderStages,
  updateStage,
  type Stage,
} from "../../services/stages.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { EtapasTab } from "../EtapasTab"

/**
 * O DndContext do @dnd-kit depende de medições que o jsdom não faz, então o
 * arraste real não acontece aqui. O mock guarda o `onDragEnd` para o teste
 * disparar o evento diretamente — é onde mora a regra de reordenar.
 */
let dragEnd: ((event: DragEndEvent) => void) | undefined

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/core")>()
  return {
    ...original,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode
      onDragEnd: (event: DragEndEvent) => void
    }) => {
      dragEnd = onDragEnd
      return <div>{children}</div>
    },
  }
})
vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
}))
vi.mock("@/pages/projetos/services/projects.service", () => ({ getProjectAcompanhamento: vi.fn() }))
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
// O formulário de etapa tem teste próprio e traz react-hook-form junto.
vi.mock("../StageFormModal", () => ({
  StageFormModal: ({ open, stage }: { open: boolean; stage: Stage | null }) =>
    open ? <div>{stage ? `form-editar-${stage.id}` : "form-criar"}</div> : null,
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listar = vi.mocked(listStages)
const editar = vi.mocked(updateStage)
const excluir = vi.mocked(deleteStage)
const reordenar = vi.mocked(reorderStages)
const anexos = vi.mocked(listAttachments)
const acompanhamento = vi.mocked(getProjectAcompanhamento)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: null,
    displayOrder: 1,
    status: EtapaStatus.PLANNED,
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
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

function foto(stageId: number | null): Attachment {
  return {
    id: Math.random(),
    constructionProjectId: 7,
    stageId,
    taskId: null,
    uploadedByUserId: 1,
    fileName: "obra.png",
    fileType: "image/png",
    uploadedAt: "2026-01-01T00:00:00Z",
  }
}

/** Evento de drop com o mínimo que `handleDragEnd` lê. */
function drop(activeId: number, overId: string | number): DragEndEvent {
  return { active: { id: activeId }, over: { id: overId } } as DragEndEvent
}

function render(route = "/") {
  return renderWithProviders(<EtapasTab projectId={7} projectStartDate="2026-01-01" />, { route })
}

/** Monta e espera a lista sair do esqueleto. */
async function renderCarregado(route?: string) {
  const view = render(route)
  await screen.findAllByRole("listitem")
  return view
}

/** Nomes das etapas na ordem em que a lista mostra. */
function nomes() {
  return screen.getAllByRole("listitem").map((li) => li.querySelector(".truncate")?.textContent)
}

beforeEach(() => {
  vi.resetAllMocks()
  dragEnd = undefined
  listar.mockResolvedValue([etapa()])
  anexos.mockResolvedValue([])
  acompanhamento.mockResolvedValue({
    obraId: 7,
    titulo: "Obra",
    status: ProjectStatus.IN_PROGRESS,
    totalEtapas: 1,
    etapasConcluidas: 0,
    totalTarefas: 4,
    tarefasConcluidas: 2,
    stageStatusCounts: {},
    taskStatusCounts: { DONE: 2, TODO: 2 },
    etapas: [
      {
        id: 1,
        name: "Fundação",
        description: null,
        displayOrder: 1,
        status: EtapaStatus.IN_PROGRESS,
        plannedStartDate: "2026-01-01",
        plannedEndDate: "2099-03-01",
        totalTarefas: 4,
        taskStatusCounts: { DONE: 2, TODO: 2 },
      },
    ],
  })
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_STAGES],
  })
  editar.mockResolvedValue(etapa())
  excluir.mockResolvedValue(undefined)
  // O servidor devolve a lista já reordenada, e o hook grava no cache.
  reordenar.mockImplementation(async (_id, ids) => ({
    message: "ok",
    stages: ids.map((id, i) => etapa({ id, name: `Etapa ${id}`, displayOrder: i + 1 })),
  }))
})


describe("<EtapasTab /> — estados da lista", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listar.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("oferece recarregar quando a consulta falha", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    render()

    await screen.findByText("Não foi possível carregar o acompanhamento.")
    listar.mockClear()
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))
    await waitFor(() => expect(listar).toHaveBeenCalled())
  })

  it("convida a criar a primeira etapa em obra vazia", async () => {
    listar.mockResolvedValue([])

    render()

    expect(await screen.findByText("Nenhuma etapa cadastrada")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /Criar primeira etapa/ }))
    expect(screen.getByText("form-criar")).toBeInTheDocument()
  })

  it("esconde o convite de criar de quem não pode", async () => {
    listar.mockResolvedValue([])
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    render()

    expect(await screen.findByText("Nenhuma etapa cadastrada")).toBeInTheDocument()
    // `can()` é fail-open enquanto carrega — a barra de ações piscaria a cada
    // entrada de tela se escondesse tudo primeiro. Daí esperar a resposta.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Criar primeira etapa/ })).not.toBeInTheDocument(),
    )
  })
})

/** Uma lista só, na ordem do ciclo: a posição é a informação. */
describe("<EtapasTab /> — lista do ciclo", () => {
  it("ordena por displayOrder, não pela ordem de criação", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, name: "Segunda", displayOrder: 2 }),
      etapa({ id: 2, name: "Primeira", displayOrder: 1 }),
    ])

    await renderCarregado()

    expect(nomes()).toEqual(["Primeira", "Segunda"])
    expect(screen.getByText("01")).toBeInTheDocument()
    expect(screen.getByText("02")).toBeInTheDocument()
  })

  it("resume quantas etapas estão concluídas", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, status: EtapaStatus.DONE }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2 }),
    ])

    await renderCarregado()

    expect(screen.getByText("1 de 2 etapas concluídas")).toBeInTheDocument()
  })

  // O avanço vem das tarefas (acompanhamento), não do tempo decorrido.
  it("mostra o avanço real da etapa", async () => {
    await renderCarregado()

    expect(await screen.findByRole("progressbar", { name: "Avanço de Fundação" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    )
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("marca a etapa vencida com os dias de atraso", async () => {
    const vencida = (await acompanhamento(7)).etapas[0]
    acompanhamento.mockResolvedValue({
      ...(await acompanhamento(7)),
      etapas: [{ ...vencida, plannedEndDate: "2026-01-10" }],
    })

    await renderCarregado()

    expect(await screen.findByText(/dias? de atraso/)).toBeInTheDocument()
  })

  it("avisa que a etapa ainda não tem tarefas", async () => {
    const vazia = (await acompanhamento(7)).etapas[0]
    acompanhamento.mockResolvedValue({
      ...(await acompanhamento(7)),
      etapas: [{ ...vazia, totalTarefas: 0, taskStatusCounts: {} }],
    })

    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { expanded: false }))

    expect(screen.getByText(/Nenhuma tarefa nesta etapa/)).toBeInTheDocument()
  })

  it("abre a linha com descrição, tarefas e só as fotos da etapa", async () => {
    listar.mockResolvedValue([etapa({ description: "Sapatas e baldrames" })])
    anexos.mockResolvedValue([foto(1), foto(1), foto(null), { ...foto(1), fileType: "application/pdf" }])

    await renderCarregado()
    await screen.findByText("50%")
    await userEvent.click(screen.getByRole("button", { expanded: false }))

    expect(screen.getByText("Sapatas e baldrames")).toBeInTheDocument()
    expect(await screen.findByText(/2 fotos/)).toBeInTheDocument()
    expect(screen.getByText(/2 de 4/)).toBeInTheDocument()
  })
})

describe("<EtapasTab /> — status e ordem", () => {
  it("troca o status pelo próprio pill", async () => {
    await renderCarregado()

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /Status da etapa Fundação/ }),
      EtapaStatus.DONE,
    )

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0][1]).toMatchObject({ status: EtapaStatus.DONE })
    expect(reordenar).not.toHaveBeenCalled()
  })

  it("volta o status quando o servidor recusa", async () => {
    let recusar = () => {}
    editar.mockImplementation(
      () => new Promise((_, reject) => { recusar = () => reject(new Error("Sem permissão.")) }),
    )
    await renderCarregado()
    const status = screen.getByRole("combobox", { name: /Status da etapa Fundação/ })

    await userEvent.selectOptions(status, EtapaStatus.BLOCKED)
    await waitFor(() => expect(status).toHaveValue(EtapaStatus.BLOCKED))

    recusar()

    await waitFor(() => expect(status).toHaveValue(EtapaStatus.PLANNED))
    expect(reordenar).not.toHaveBeenCalled()
  })

  it("ignora escolher o mesmo status", async () => {
    await renderCarregado()

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /Status da etapa Fundação/ }),
      EtapaStatus.PLANNED,
    )

    expect(editar).not.toHaveBeenCalled()
  })

  it("desce e sobe a etapa sem arrastar", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, displayOrder: 1 }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2 }),
    ])
    await renderCarregado()

    const [descer] = screen.getAllByRole("button", { name: "Mover para baixo" })
    await userEvent.click(descer)

    await waitFor(() => expect(reordenar).toHaveBeenCalledWith(7, [2, 1]))
    expect(editar).not.toHaveBeenCalled()
  })

  it("não deixa subir a primeira nem descer a última", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, displayOrder: 1 }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2 }),
    ])
    await renderCarregado()

    expect(screen.getAllByRole("button", { name: "Mover para cima" })[0]).toBeDisabled()
    expect(screen.getAllByRole("button", { name: "Mover para baixo" })[1]).toBeDisabled()
  })

  it("reordena quando a linha cai sobre outra", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, displayOrder: 1 }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2 }),
      etapa({ id: 3, name: "Cobertura", displayOrder: 3 }),
    ])
    await renderCarregado()

    dragEnd?.(drop(3, 1))

    await waitFor(() => expect(reordenar).toHaveBeenCalledWith(7, [3, 1, 2]))
  })

  it.each([
    ["soltou fora de qualquer alvo", { active: { id: 1 }, over: null } as DragEndEvent],
    ["soltou sobre si mesmo", drop(1, 1)],
    ["soltou sobre algo que não é etapa", drop(1, 99)],
  ])("ignora o arraste que %s", async (_caso, evento) => {
    await renderCarregado()

    dragEnd?.(evento)

    expect(nomes()).toEqual(["Fundação"])
    expect(reordenar).not.toHaveBeenCalled()
  })

  /**
   * A lista se reordena na hora, sem esperar o round-trip — do contrário a
   * linha voltaria ao lugar antigo antes de assentar. Em erro o override é
   * solto para a lista voltar ao que o servidor diz.
   */
  it("reordena na hora e volta atrás quando o servidor recusa", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, name: "Primeira", displayOrder: 1 }),
      etapa({ id: 2, name: "Segunda", displayOrder: 2 }),
    ])
    // A recusa fica pendurada até o teste soltar: sem isso ela chega tão
    // rápido que o estado otimista nunca chega a ser observado.
    let recusar = () => {}
    reordenar.mockImplementation(
      () => new Promise((_, reject) => { recusar = () => reject(new Error("Conflito de ordem.")) }),
    )
    await renderCarregado()

    dragEnd?.(drop(2, 1))

    await waitFor(() => expect(nomes()).toEqual(["Segunda", "Primeira"]))

    recusar()

    await waitFor(() => expect(nomes()).toEqual(["Primeira", "Segunda"]))
  })
})

describe("<EtapasTab /> — cronograma", () => {
  it("troca a lista pelo Gantt e guarda a vista na URL", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("tab", { name: "Cronograma" }))

    expect((await screen.findAllByRole("button", { name: /Fundação/ })).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
  })

  it("abre a edição ao escolher a etapa no Gantt", async () => {
    render("/?vista=cronograma")

    const barras = await screen.findAllByRole("button", { name: /Fundação/ })
    await userEvent.click(barras[0])

    expect(screen.getByText("form-editar-1")).toBeInTheDocument()
  })

  it("volta para a lista", async () => {
    render("/?vista=cronograma")
    await screen.findAllByRole("button", { name: /Fundação/ })

    await userEvent.click(screen.getByRole("tab", { name: "Lista" }))

    expect(await screen.findAllByRole("listitem")).toHaveLength(1)
  })
})

describe("<EtapasTab /> — formulário e exclusão", () => {
  it("abre o formulário em branco pelo botão de criar", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: /Nova Etapa/ }))

    expect(screen.getByText("form-criar")).toBeInTheDocument()
  })

  it("adiciona ao fim do ciclo pelo botão tracejado", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: /Adicionar etapa ao fim/ }))

    expect(screen.getByText("form-criar")).toBeInTheDocument()
  })

  it("abre o formulário da etapa pelo editar", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Editar" }))

    expect(screen.getByText("form-editar-1")).toBeInTheDocument()
  })

  it("esconde criar, reordenar e editar de quem não pode", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    await renderCarregado()

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Nova Etapa/ })).not.toBeInTheDocument(),
    )
    expect(screen.queryByText(/Arraste pela alça/)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Reordenar etapa" })).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("pede confirmação antes de excluir e exclui ao confirmar", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    expect(screen.getByRole("heading", { name: "Excluir etapa" })).toBeInTheDocument()
    expect(screen.getByText(/"Fundação"/)).toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()

    const botoes = screen.getAllByRole("button", { name: "Excluir" })
    await userEvent.click(botoes[botoes.length - 1])

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(1))
  })

  it("desiste sem excluir no cancelar", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Excluir etapa" })).not.toBeInTheDocument(),
    )
    expect(excluir).not.toHaveBeenCalled()
  })
})
