import type { DragEndEvent } from "@dnd-kit/core"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import type { Attachment } from "@/shared/types/attachment"
import { renderWithProviders } from "@/test/renderWithProviders"

import { sectionDroppableId } from "../../constants/stageSections"
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
 * disparar o evento diretamente — é onde mora a regra: reordenar quando o card
 * cai sobre outro card, mudar de status quando cai numa seção.
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

function render() {
  return renderWithProviders(<EtapasTab projectId={7} projectStartDate="2026-01-01" />)
}

/** Monta e espera a lista sair do esqueleto — o h3 é o nome da etapa. */
async function renderCarregado() {
  const view = render()
  await screen.findAllByRole("heading", { level: 3 })
  return view
}

function secao(nome: string) {
  return within(screen.getByRole("region", { name: nome }))
}

beforeEach(() => {
  vi.resetAllMocks()
  dragEnd = undefined
  listar.mockResolvedValue([etapa()])
  anexos.mockResolvedValue([])
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro()])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_STAGES],
  })
  editar.mockResolvedValue(etapa())
  excluir.mockResolvedValue(undefined)
  reordenar.mockResolvedValue({ message: "ok", stages: [] })
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
    expect(screen.getByRole("button", { name: /Criar primeira etapa/ })).toBeInTheDocument()
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

/**
 * É um kanban deitado: cada seção é um status, e a ordem global vale para a
 * lista toda — por isso um `SortableContext` único cobrindo as quatro seções.
 */
describe("<EtapasTab /> — seções por status", () => {
  it("desenha as quatro seções do ciclo, na ordem do fluxo", async () => {
    await renderCarregado()

    for (const nome of ["Planejada", "Em andamento", "Concluída", "Bloqueada"]) {
      expect(screen.getByRole("region", { name: nome })).toBeInTheDocument()
    }
  })

  it("põe cada etapa na seção do status dela", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, name: "Fundação", status: EtapaStatus.PLANNED }),
      etapa({ id: 2, name: "Alvenaria", status: EtapaStatus.DONE, displayOrder: 2 }),
    ])

    await renderCarregado()

    expect(secao("Planejada").getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
    expect(secao("Concluída").getByRole("heading", { name: "Alvenaria" })).toBeInTheDocument()
  })

  it("avisa quando a seção está vazia", async () => {
    await renderCarregado()

    expect(secao("Bloqueada").getByText("Nenhuma etapa aqui")).toBeInTheDocument()
  })

  // Status fora do mapa (dado legado do backend) cai na primeira seção: sumir
  // da tela seria pior que aparecer no lugar aproximado.
  it("acomoda status desconhecido na primeira seção em vez de sumir com a etapa", async () => {
    listar.mockResolvedValue([etapa({ status: "ARCHIVED" as EtapaStatus })])

    await renderCarregado()

    expect(secao("Planejada").getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
  })

  it("ordena a lista por displayOrder, não pela ordem de criação", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, name: "Segunda", displayOrder: 2 }),
      etapa({ id: 2, name: "Primeira", displayOrder: 1 }),
    ])

    await renderCarregado()

    const nomes = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    expect(nomes).toEqual(["Primeira", "Segunda"])
  })

  // A contagem de fotos vem dos anexos da obra, filtrados por etapa e por MIME
  // de imagem — documento anexado à etapa não conta como foto.
  it("conta só as imagens vinculadas à etapa", async () => {
    anexos.mockResolvedValue([
      foto(1),
      foto(1),
      foto(null),
      { ...foto(1), fileType: "application/pdf" },
    ])

    await renderCarregado()

    expect(await screen.findByText("2 fotos")).toBeInTheDocument()
  })
})

describe("<EtapasTab /> — arrastar", () => {
  it("só reordena quando o card cai sobre outro card da mesma seção", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, displayOrder: 1 }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2 }),
    ])
    await renderCarregado()

    dragEnd?.(drop(2, 1))

    await waitFor(() => expect(reordenar).toHaveBeenCalledWith(7, [2, 1]))
    expect(editar).not.toHaveBeenCalled()
  })

  // Soltar na área de uma seção muda só o status: a posição na ordem global
  // fica onde estava.
  it("só troca o status quando o card cai na área de outra seção", async () => {
    await renderCarregado()

    dragEnd?.(drop(1, sectionDroppableId(EtapaStatus.DONE)))

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0][1]).toMatchObject({ status: EtapaStatus.DONE })
    expect(reordenar).not.toHaveBeenCalled()
  })

  it("faz as duas coisas quando o card cai sobre um card de outra seção", async () => {
    listar.mockResolvedValue([
      etapa({ id: 1, displayOrder: 1, status: EtapaStatus.PLANNED }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2, status: EtapaStatus.DONE }),
    ])
    await renderCarregado()

    dragEnd?.(drop(1, 2))

    await waitFor(() => expect(reordenar).toHaveBeenCalled())
    expect(editar.mock.calls[0][1]).toMatchObject({ status: EtapaStatus.DONE })
  })

  it.each([
    ["soltou fora de qualquer alvo", { active: { id: 1 }, over: null } as DragEndEvent],
    ["soltou sobre si mesmo", drop(1, 1)],
    ["soltou na seção de origem", drop(1, sectionDroppableId(EtapaStatus.PLANNED))],
  ])("ignora o arraste que %s", async (_caso, evento) => {
    await renderCarregado()

    dragEnd?.(evento)

    await waitFor(() => expect(screen.getByRole("heading", { name: "Fundação" })).toBeInTheDocument())
    expect(reordenar).not.toHaveBeenCalled()
    expect(editar).not.toHaveBeenCalled()
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

    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Segunda"),
    )

    recusar()

    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Primeira"),
    )
  })
})

describe("<EtapasTab /> — formulário e exclusão", () => {
  it("abre o formulário em branco pelo botão de criar", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: /Nova Etapa/ }))

    expect(screen.getByText("form-criar")).toBeInTheDocument()
  })

  it("abre o formulário da etapa clicada", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("heading", { name: "Fundação" }))

    expect(screen.getByText("form-editar-1")).toBeInTheDocument()
  })

  it("esconde criar e a dica de reordenar de quem não pode editar", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    await renderCarregado()

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Nova Etapa/ })).not.toBeInTheDocument(),
    )
    expect(screen.queryByText(/Arraste para reordenar/)).not.toBeInTheDocument()
  })

  it("pede confirmação antes de excluir", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))
    await userEvent.click(screen.getByText("Excluir"))

    expect(screen.getByRole("heading", { name: "Excluir etapa" })).toBeInTheDocument()
    expect(screen.getByText(/"Fundação"/)).toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()
  })

  it("exclui ao confirmar", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))
    await userEvent.click(screen.getByText("Excluir"))

    // O menu da linha fecha ao escolher, então só sobra o botão do modal.
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(1))
  })

  it("desiste sem excluir no cancelar", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))
    await userEvent.click(screen.getByText("Excluir"))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("heading", { name: "Excluir etapa" })).not.toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()
  })
})
