import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { toast } from "react-toastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { renderWithProviders } from "@/test/renderWithProviders"
import { passarJanelaDoDesfazer, relogioDoDesfazer } from "@/test/undo"

import { getEquipeMembers } from "../../services/equipes.service"
import { ProjectPermission, ProjectRole, getRolePermissions } from "../../services/projectPermissions.service"
import { listStages, type Stage } from "../../services/stages.service"
import { createTarefa, deleteTarefa, getTarefas, updateTarefa } from "../../services/tarefas.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import type { Tarefa, TarefaStatus } from "../../types/tarefas"
import { TarefasTab } from "../TarefasTab"

/**
 * O jsdom não mede nada, então o arraste real do @dnd-kit não acontece. O mock
 * guarda os handlers do DndContext para o teste disparar o drop direto.
 */
let dragEnd: ((event: DragEndEvent) => void) | undefined
let dragStart: ((event: DragStartEvent) => void) | undefined

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/core")>()
  return {
    ...original,
    DndContext: (props: { children: React.ReactNode; onDragEnd: typeof dragEnd; onDragStart: typeof dragStart }) => {
      dragEnd = props.onDragEnd
      dragStart = props.onDragStart
      return <div>{props.children}</div>
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="overlay">{children}</div>,
  }
})
vi.mock("../../services/stages.service", () => ({ listStages: vi.fn() }))
vi.mock("../../services/tarefas.service", () => ({
  getTarefas: vi.fn(),
  createTarefa: vi.fn(),
  updateTarefa: vi.fn(),
  deleteTarefa: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({ getEquipeMembers: vi.fn() }))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listarEtapas = vi.mocked(listStages)
const listarTarefas = vi.mocked(getTarefas)
const criar = vi.mocked(createTarefa)
const editar = vi.mocked(updateTarefa)
const excluir = vi.mocked(deleteTarefa)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function etapa(id: number, name: string, over: Partial<Stage> = {}): Stage {
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
    ...over,
  }
}

function tarefa(id: number, title: string, over: Partial<Tarefa> = {}): Tarefa {
  return {
    id,
    title,
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2099-12-31",
    assigneeUserId: null,
    assigneeName: null,
    constructionProjectId: 7,
    createdAt: "2026-01-01T00:00:00Z",
    completedAt: null,
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

function render(route = "/") {
  return renderWithProviders(<TarefasTab projectId={7} />, { route })
}

async function renderCarregado(route?: string) {
  const view = render(route)
  await screen.findByRole("region", { name: "Não iniciada" })
  return view
}

function coluna(nome: string) {
  return within(screen.getByRole("region", { name: nome }))
}

function card(titulo: string) {
  return screen.getByRole("button", { name: new RegExp(`^${titulo},`) })
}

/** O conteúdo do último toast de sucesso (um <ToastMessage>). */
function ultimoToast() {
  const calls = vi.mocked(toast.success).mock.calls
  return (calls[calls.length - 1][0] as ReactElement<{ title: string; action?: { onClick: () => void } }>).props
}

function tarefasPorEtapa(map: Record<number, Tarefa[]>) {
  listarTarefas.mockImplementation(async (stageId) => map[stageId] ?? [])
}

beforeEach(() => {
  vi.resetAllMocks()
  dragEnd = undefined
  dragStart = undefined
  listarEtapas.mockResolvedValue([etapa(1, "Fundação", { status: EtapaStatus.IN_PROGRESS }), etapa(2, "Alvenaria")])
  tarefasPorEtapa({ 1: [tarefa(11, "Escavar sapatas"), tarefa(12, "Concretar", { status: "IN_PROGRESS" })], 2: [tarefa(21, "Levantar paredes")] })
  vi.mocked(getMyProfile).mockResolvedValue(EU)
  vi.mocked(getEquipeMembers).mockResolvedValue([membro()])
  permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [ProjectPermission.MANAGE_TASKS] })
  editar.mockImplementation(async (_stage, id, data) => ({ ...tarefa(id, data.title ?? ""), ...data }) as Tarefa)
  criar.mockImplementation(async (_stage, data) => tarefa(99, data.title))
  excluir.mockResolvedValue(undefined)
})

describe("<TarefasTab /> — estados", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listarEtapas.mockImplementation(() => new Promise(() => {}))
    const { container } = render()
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4)
  })

  it("sem etapas, manda cadastrar etapas primeiro", async () => {
    listarEtapas.mockResolvedValue([])
    render()
    expect(await screen.findByText("Nenhuma etapa cadastrada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ir para Etapas" })).toBeInTheDocument()
  })
})

describe("<TarefasTab /> — quadro", () => {
  it("põe cada tarefa na coluna do seu status, com a etapa no card", async () => {
    await renderCarregado()

    expect(coluna("Não iniciada").getByText("Escavar sapatas")).toBeInTheDocument()
    expect(coluna("Em andamento").getByText("Concretar")).toBeInTheDocument()
    expect(coluna("Não iniciada").getByText("Alvenaria")).toBeInTheDocument()
    expect(coluna("Bloqueada").getByText("Arraste tarefas para cá")).toBeInTheDocument()
    expect(screen.getByText("3 tarefas")).toBeInTheDocument()
  })

  it("mostra só as cinco concluídas mais recentes até pedir mais", async () => {
    tarefasPorEtapa({ 1: [1, 2, 3, 4, 5, 6, 7].map((id) => tarefa(id, `Feita ${id}`, { status: "DONE", completedAt: `2026-01-0${id}T00:00:00Z` })) })
    await renderCarregado()

    expect(coluna("Concluída").queryByText("Feita 1")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Ver mais 2 concluídas" }))
    expect(coluna("Concluída").getByText("Feita 1")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Mostrar só as recentes" }))
    expect(coluna("Concluída").queryByText("Feita 1")).not.toBeInTheDocument()
  })

  it("marca a tarefa vencida com os dias de atraso", async () => {
    tarefasPorEtapa({ 1: [tarefa(11, "Atrasada", { plannedEndDate: "2020-01-01" })] })
    await renderCarregado()
    expect(screen.getByText(/d de atraso/)).toBeInTheDocument()
  })
})

describe("<TarefasTab /> — arrastar", () => {
  it("move para a coluna solta, mostra o fantasma e oferece desfazer", async () => {
    await renderCarregado()

    act(() => dragStart?.({ active: { id: 11 } } as DragStartEvent))
    expect(within(screen.getByTestId("overlay")).getByText("Escavar sapatas")).toBeInTheDocument()
    act(() => dragEnd?.({ active: { id: 11 }, over: { id: "col:BLOCKED" } } as DragEndEvent))

    // O card troca de coluna antes da resposta do servidor.
    expect(coluna("Bloqueada").getByText("Escavar sapatas")).toBeInTheDocument()
    await waitFor(() => expect(editar).toHaveBeenCalledWith(1, 11, { title: "Escavar sapatas", status: "BLOCKED" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(ultimoToast().title).toBe("Movida para bloqueada")

    act(() => ultimoToast().action?.onClick())
    await waitFor(() => expect(editar).toHaveBeenLastCalledWith(1, 11, { title: "Escavar sapatas", status: "TODO" }))
  })

  it("soltar sobre um card vale o status da coluna dele", async () => {
    await renderCarregado()
    act(() => dragEnd?.({ active: { id: 11 }, over: { id: 12 } } as DragEndEvent))
    await waitFor(() => expect(editar).toHaveBeenCalledWith(1, 11, expect.objectContaining({ status: "IN_PROGRESS" as TarefaStatus })))
  })

  it("ignora soltar fora, na mesma coluna ou sem tarefa", async () => {
    await renderCarregado()
    act(() => dragEnd?.({ active: { id: 11 }, over: null } as DragEndEvent))
    act(() => dragEnd?.({ active: { id: 11 }, over: { id: "col:TODO" } } as DragEndEvent))
    act(() => dragEnd?.({ active: { id: 404 }, over: { id: "col:DONE" } } as DragEndEvent))
    expect(editar).not.toHaveBeenCalled()
  })

  it("volta o card quando o servidor recusa", async () => {
    editar.mockRejectedValue(new Error("Sem permissão."))
    await renderCarregado()

    act(() => dragEnd?.({ active: { id: 11 }, over: { id: "col:DONE" } } as DragEndEvent))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sem permissão."))
    await waitFor(() => expect(coluna("Não iniciada").getByText("Escavar sapatas")).toBeInTheDocument())
  })
})

describe("<TarefasTab /> — filtros na URL", () => {
  it("filtra por busca sem acento e limpa tudo", async () => {
    await renderCarregado()

    await userEvent.type(screen.getByPlaceholderText("Filtrar tarefas"), "escavar")
    expect(screen.queryByText("Concretar")).not.toBeInTheDocument()
    expect(screen.getByText("1 tarefa")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(screen.getByText("Concretar")).toBeInTheDocument()
  })

  it("lê etapa, minhas e atrasadas do link", async () => {
    tarefasPorEtapa({ 1: [tarefa(11, "Minha atrasada", { assigneeUserId: 1, plannedEndDate: "2020-01-01" }), tarefa(12, "Outra")] })
    await renderCarregado("/?etapa=1&minhas=1&atrasadas=1")

    await screen.findByText("Minha atrasada")
    expect(screen.queryByText("Outra")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Atribuídas a mim/ })).toHaveAttribute("aria-pressed", "true")
    // Com etapa filtrada o card não repete o nome da etapa.
    expect(coluna("Não iniciada").queryByText("Fundação")).not.toBeInTheDocument()
  })

  it("liga e desliga os chips", async () => {
    await renderCarregado()
    const minhas = screen.getByRole("button", { name: /Atribuídas a mim/ })
    await userEvent.click(minhas)
    expect(minhas).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Nenhuma tarefa")).toBeInTheDocument()
    await userEvent.click(minhas)
    await userEvent.click(screen.getByRole("button", { name: /Atrasadas/ }))
    expect(screen.getByRole("button", { name: /Atrasadas/ })).toHaveAttribute("aria-pressed", "true")
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Etapa" }), "2")
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Etapa" }), "")
  })
})

describe("<TarefasTab /> — adição rápida", () => {
  it("cria na coluna com o título, na etapa em andamento, e segue aberta", async () => {
    await renderCarregado()

    await userEvent.click(coluna("Bloqueada").getByRole("button", { name: "Adicionar tarefa" }))
    const campo = screen.getByRole("textbox", { name: "Título da nova tarefa" })
    expect(screen.getByText(/Em Fundação/)).toBeInTheDocument()
    await userEvent.type(campo, "Aguardar laudo{Enter}")

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toBe(1)
    expect(criar.mock.calls[0][1]).toMatchObject({ title: "Aguardar laudo", status: "BLOCKED", priority: "MEDIUM" })
    await waitFor(() => expect(campo).toHaveValue(""))

    await userEvent.type(campo, "{Escape}")
    expect(screen.queryByRole("textbox", { name: "Título da nova tarefa" })).not.toBeInTheDocument()
  })
})

describe("<TarefasTab /> — drawer", () => {
  it("abre a tarefa e salva o campo ao sair dele", async () => {
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))

    const dialog = within(await screen.findByRole("dialog", { name: "Detalhes da tarefa" }))
    const titulo = dialog.getByLabelText("Título")
    await userEvent.clear(titulo)
    await userEvent.type(titulo, "Escavar sapatas S1")
    await userEvent.tab()

    await waitFor(() => expect(editar).toHaveBeenCalledWith(1, 11, { title: "Escavar sapatas S1" }))
    expect(dialog.getByText("As alterações são salvas automaticamente.")).toBeInTheDocument()
  })

  it("não salva campo inválido e mostra o erro nele", async () => {
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))

    await userEvent.clear(dialog.getByLabelText("Título"))
    await userEvent.tab()

    expect(await dialog.findByText("Dê um título à tarefa.")).toBeInTheDocument()
    expect(editar).not.toHaveBeenCalled()
  })

  it("recusa início antes da etapa", async () => {
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))

    const inicio = dialog.getByLabelText("Início")
    await userEvent.clear(inicio)
    await userEvent.type(inicio, "2026-01-01")
    await userEvent.tab()

    expect(await dialog.findByText("A tarefa não pode começar antes da etapa vinculada.")).toBeInTheDocument()
    expect(editar).not.toHaveBeenCalled()
  })

  it("troca status e prioridade na hora", async () => {
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))

    await userEvent.click(dialog.getByRole("button", { name: "Concluída" }))
    await waitFor(() => expect(editar).toHaveBeenCalledWith(1, 11, { title: "Escavar sapatas", status: "DONE" }))
    await waitFor(() => expect(ultimoToast().title).toBe("Tarefa concluída"))

    await userEvent.selectOptions(dialog.getByLabelText("Prioridade"), "HIGH")
    await waitFor(() => expect(editar).toHaveBeenCalledWith(1, 11, { title: "Escavar sapatas", priority: "HIGH" }))
  })

  it("exclui pelo drawer com Desfazer: fecha, some do quadro e vai ao servidor depois", async () => {
    relogioDoDesfazer()
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    await userEvent.click(await screen.findByRole("button", { name: "Excluir tarefa" }))

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Detalhes da tarefa" })).not.toBeInTheDocument())
    expect(screen.queryByText("Escavar sapatas")).not.toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()
    await passarJanelaDoDesfazer()
    await waitFor(() => expect(excluir).toHaveBeenCalledWith(1, 11))
  })

  it("cria pelo botão de nova tarefa, na etapa escolhida", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: /Nova tarefa/ }))
    const dialog = within(await screen.findByRole("dialog", { name: "Nova tarefa" }))

    await userEvent.click(dialog.getByRole("button", { name: "Criar tarefa" }))
    expect(await dialog.findByText("Dê um título à tarefa.")).toBeInTheDocument()

    await userEvent.type(dialog.getByLabelText("Título"), "Impermeabilizar")
    await userEvent.selectOptions(dialog.getByLabelText("Etapa"), "2")
    await userEvent.selectOptions(dialog.getByLabelText("Responsável"), "1")
    await userEvent.click(dialog.getByRole("button", { name: "Criar tarefa" }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toBe(2)
    expect(criar.mock.calls[0][1]).toMatchObject({ title: "Impermeabilizar", assigneeUserId: 1 })
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova tarefa" })).not.toBeInTheDocument())
  })
})

describe("<TarefasTab /> — bordas", () => {
  it("avisa o que vence hoje e abre o card pelo Enter", async () => {
    const hoje = new Date()
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
    tarefasPorEtapa({ 1: [tarefa(11, "Hoje", { plannedEndDate: iso })] })
    await renderCarregado()

    expect(screen.getByText("Vence hoje")).toBeInTheDocument()
    card("Hoje").focus()
    await userEvent.keyboard("{Enter}")
    expect(await screen.findByRole("dialog", { name: "Detalhes da tarefa" })).toBeInTheDocument()
  })

  it("desfaz o campo quando o servidor recusa a alteração", async () => {
    editar.mockRejectedValue(new Error(""))
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))

    await userEvent.selectOptions(dialog.getByLabelText("Prioridade"), "LOW")

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar a alteração."))
  })

  it("pede data de início na etapa antes de datar a tarefa", async () => {
    listarEtapas.mockResolvedValue([etapa(1, "Fundação", { plannedStartDate: null })])
    await renderCarregado()
    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))

    const inicio = dialog.getByLabelText("Início")
    await userEvent.clear(inicio)
    await userEvent.type(inicio, "2026-05-01")
    await userEvent.tab()

    expect(await dialog.findByText("A etapa vinculada precisa ter uma data de início.")).toBeInTheDocument()
  })

  it("mantém aberto quando criar falha e avisa quando excluir falha", async () => {
    relogioDoDesfazer()
    criar.mockRejectedValue(new Error(""))
    excluir.mockRejectedValue(new Error(""))
    await renderCarregado()

    await userEvent.click(coluna("Não iniciada").getByRole("button", { name: "Adicionar tarefa" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Título da nova tarefa" }), "Falha{Enter}")
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível criar a tarefa."))
    expect(screen.getByRole("textbox", { name: "Título da nova tarefa" })).toHaveValue("Falha")

    await userEvent.click(card("Escavar sapatas"))
    await userEvent.click(await screen.findByRole("button", { name: "Excluir tarefa" }))
    await passarJanelaDoDesfazer()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível excluir a tarefa."))
  })
})

describe("<TarefasTab /> — criar sem responsável", () => {
  // O <select> recebe o valor inicial `null`; virar 0 reprovaria o schema.
  it("cria sem escolher responsável", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: /Nova tarefa/ }))
    const dialog = within(await screen.findByRole("dialog", { name: "Nova tarefa" }))

    await userEvent.type(dialog.getByLabelText("Título"), "Sem dono")
    await userEvent.click(dialog.getByRole("button", { name: "Criar tarefa" }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][1]).toMatchObject({ title: "Sem dono", assigneeUserId: null })
  })
})

describe("<TarefasTab /> — permissões", () => {
  it("quem só vê não arrasta, não cria e abre o drawer em leitura", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
    await renderCarregado()

    await waitFor(() => expect(screen.queryByRole("button", { name: "Adicionar tarefa" })).not.toBeInTheDocument())
    expect(screen.queryByRole("button", { name: /Nova tarefa/ })).not.toBeInTheDocument()

    await userEvent.click(card("Escavar sapatas"))
    const dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByLabelText("Título")).toBeDisabled()
    expect(dialog.queryByRole("button", { name: "Excluir tarefa" })).not.toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
