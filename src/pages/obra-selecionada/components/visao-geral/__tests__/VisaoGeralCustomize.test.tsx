import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { deletePreference, getPreference, putPreference } from "@/shared/services/preferences.service"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import type { OverviewLayout } from "../layout/layoutModel"
import { VisaoGeral } from "../VisaoGeral"

// Os widgets viram marcadores: aqui o que se testa é o layout, não o conteúdo
// de cada card (esse está em obraOverview.test.tsx e widgets.test.tsx).
vi.mock("../OverviewAttention", () => ({ OverviewAttention: () => <p>w-attention</p> }))
vi.mock("../OverviewBudget", () => ({ OverviewBudget: () => <p>w-budget</p> }))
vi.mock("../OverviewTeam", () => ({ OverviewTeam: () => <p>w-team</p> }))
vi.mock("../OverviewDiary", () => ({ OverviewDiary: () => <p>w-diary</p> }))
vi.mock("../CurrentStageCard", () => ({ CurrentStageCard: () => <p>w-current-stage</p> }))
vi.mock("../widgets/OverviewSections", () => ({
  ScheduleSection: () => <p>w-schedule</p>,
  DocumentsSection: () => <p>w-documents</p>,
}))
vi.mock("../widgets/MyTasksWidget", () => ({ MyTasksWidget: () => <p>w-my-tasks</p> }))
vi.mock("../widgets/ProposalsWidget", () => ({ ProposalsWidget: () => <p>w-proposals</p> }))
vi.mock("../widgets/WeekScheduleWidget", () => ({ WeekScheduleWidget: () => <p>w-week-schedule</p> }))
vi.mock("../widgets/RecentExpensesWidget", () => ({ RecentExpensesWidget: () => <p>w-recent-expenses</p> }))

const STAGE = {
  id: 2,
  name: "Alvenaria",
  progress: 40,
  daysLate: 0,
}
let currentStage: typeof STAGE | null = STAGE
vi.mock("@/pages/projetos/hooks/useProjectProgress", () => ({
  useProjectProgress: () => ({ stages: [STAGE], currentStage, progress: 40, lateCount: 0, openTasks: 0, isLoading: false }),
}))
vi.mock("../../../hooks/useProjectBudgetQuery", () => ({ useProjectBudgetQuery: () => null }))

/** Módulos que o perfil NÃO vê. */
let blocked = new Set<string>()
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: () => ({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: () => "w",
    canSee: (module: string) => !blocked.has(module),
    isReadOnly: () => false,
  }),
}))

vi.mock("@/shared/services/preferences.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/preferences.service")>()),
  getPreference: vi.fn(),
  putPreference: vi.fn(),
  deletePreference: vi.fn(),
}))
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-toastify")>()),
  toast: { success: vi.fn(), error: vi.fn() },
}))

const get = vi.mocked(getPreference)
const put = vi.mocked(putPreference)
const del = vi.mocked(deletePreference)

const OBRA = { id: 7, title: "Residência Mercês", status: ProjectStatus.IN_PROGRESS } as Project

const KEY = "obra.visao-geral.layout"

function column(container: HTMLElement, size: "wide" | "narrow"): string[] {
  const el = container.querySelector(`[data-column="${size}"]`)
  return Array.from(el?.querySelectorAll("[data-widget]") ?? []).map((node) => node.getAttribute("data-widget") ?? "")
}

async function renderOverview() {
  const result = renderWithProviders(<VisaoGeral project={OBRA} />)
  await screen.findByRole("button", { name: "Personalizar" })
  return result
}

function savedLayout(): OverviewLayout {
  return put.mock.calls[put.mock.calls.length - 1][1] as OverviewLayout
}

beforeEach(() => {
  vi.clearAllMocks()
  blocked = new Set()
  currentStage = STAGE
  get.mockResolvedValue(null)
  put.mockImplementation(async (key, value) => ({ key, value, updatedAt: "2026-06-15T12:00:00Z" }))
  del.mockResolvedValue(undefined)
})

describe("layout padrão", () => {
  it("reproduz a tela de antes: principal à esquerda, resumos à direita e os novos ocultos", async () => {
    const { container } = await renderOverview()

    expect(column(container, "wide")).toEqual(["attention", "schedule", "current-stage"])
    expect(column(container, "narrow")).toEqual(["budget", "team", "diary", "documents"])
    expect(screen.queryByText("w-my-tasks")).not.toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(KEY)
  })

  it("não reserva espaço para a etapa atual quando não há etapa em andamento", async () => {
    currentStage = null
    const { container } = await renderOverview()

    expect(column(container, "wide")).toEqual(["attention", "schedule"])
  })
})

describe("layout salvo", () => {
  it("respeita ordem, coluna e ocultos, e acrescenta o que o layout não conhecia", async () => {
    get.mockResolvedValue({
      key: KEY,
      updatedAt: "2026-06-01T00:00:00Z",
      value: {
        version: 1,
        widgets: [
          { id: "budget", visible: true, size: "wide" },
          { id: "attention", visible: true, size: "wide" },
          { id: "my-tasks", visible: true, size: "narrow" },
          { id: "documents", visible: false, size: "narrow" },
          { id: "widget-que-saiu", visible: true, size: "wide" },
        ],
      },
    })

    const { container } = await renderOverview()

    expect(column(container, "wide")).toEqual(["budget", "attention", "schedule", "current-stage"])
    expect(column(container, "narrow")).toEqual(["my-tasks", "team", "diary"])
    expect(screen.queryByText("w-documents")).not.toBeInTheDocument()
  })
})

describe("modo personalizar", () => {
  it("remove um widget e salva o layout no servidor", async () => {
    const { toast } = await import("react-toastify")
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Remover Orçamento" }))
    expect(column(container, "narrow")).toEqual(["team", "diary", "documents"])

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    expect(put.mock.calls[0][0]).toBe(KEY)
    expect(savedLayout().widgets.find((w) => w.id === "budget")).toEqual({ id: "budget", visible: false, size: "narrow" })
    expect(toast.success).toHaveBeenCalledWith("Visão geral salva.")
    expect(screen.getByRole("button", { name: "Personalizar" })).toBeInTheDocument()
  })

  it("cancelar descarta o rascunho sem chamar o servidor", async () => {
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Remover Equipe" }))
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(column(container, "narrow")).toEqual(["budget", "team", "diary", "documents"])
    expect(put).not.toHaveBeenCalled()
  })

  it("adiciona um widget pelo catálogo, no fim da coluna dele", async () => {
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Adicionar widget" }))
    const catalog = screen.getByRole("dialog", { name: "Adicionar widget" })
    expect(within(catalog).getByText("Minhas tarefas")).toBeInTheDocument()
    expect(within(catalog).getByText("Últimas despesas")).toBeInTheDocument()

    await userEvent.click(within(catalog).getByRole("button", { name: "Adicionar Minhas tarefas" }))

    expect(column(container, "narrow")).toEqual(["budget", "team", "diary", "documents", "my-tasks"])
    expect(within(catalog).queryByText("Minhas tarefas")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(put).toHaveBeenCalled())
    expect(savedLayout().widgets.find((w) => w.id === "my-tasks")?.visible).toBe(true)
  })

  it("reordena pelas setas, dentro da coluna", async () => {
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    expect(screen.getByRole("button", { name: "Subir Pede atenção" })).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Descer Pede atenção" }))
    expect(column(container, "wide")).toEqual(["schedule", "attention", "current-stage"])

    await userEvent.click(screen.getByRole("button", { name: "Subir Documentos recentes" }))
    expect(column(container, "narrow")).toEqual(["budget", "team", "documents", "diary"])
  })

  it("leva um widget para a outra coluna, trocando o tamanho dele", async () => {
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Levar Cronograma para a coluna lateral" }))

    expect(column(container, "wide")).toEqual(["attention", "current-stage"])
    expect(column(container, "narrow")).toContain("schedule")

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(put).toHaveBeenCalled())
    expect(savedLayout().widgets.find((w) => w.id === "schedule")?.size).toBe("narrow")
  })

  it("mostra a etapa atual como marcador na edição, mesmo sem etapa em andamento", async () => {
    currentStage = null
    await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))

    expect(screen.getByText(/Nada para mostrar agora/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover Etapa atual" })).toBeInTheDocument()
  })

  it("restaurar padrão + salvar apaga a preferência em vez de gravar uma cópia do padrão", async () => {
    get.mockResolvedValue({
      key: KEY,
      updatedAt: "2026-06-01T00:00:00Z",
      value: { version: 1, widgets: [{ id: "attention", visible: false, size: "wide" }] },
    })
    const { container } = await renderOverview()
    expect(column(container, "wide")).toEqual(["schedule", "current-stage"])

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Restaurar padrão" }))
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(del).toHaveBeenCalledWith(KEY))
    expect(put).not.toHaveBeenCalled()
    expect(column(container, "wide")).toEqual(["attention", "schedule", "current-stage"])
  })

  it("sem mudança, o botão vira Concluir e não chama o servidor", async () => {
    await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }))

    expect(put).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Personalizar" })).toBeInTheDocument()
  })

  it("se o servidor recusar, avisa e continua editando com o rascunho", async () => {
    const { toast } = await import("react-toastify")
    put.mockRejectedValue(new Error("Layout inválido"))
    const { container } = await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Remover Diário da obra" }))
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar a visão geral. Tente de novo."))
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
    expect(column(container, "narrow")).toEqual(["budget", "team", "documents"])
  })

  it("com tudo removido, mostra o vazio com atalho para adicionar", async () => {
    get.mockResolvedValue({
      key: KEY,
      updatedAt: "2026-06-01T00:00:00Z",
      value: {
        version: 1,
        widgets: ["attention", "budget", "schedule", "team", "current-stage", "diary", "documents"].map((id) => ({
          id,
          visible: false,
          size: "wide",
        })),
      },
    })
    await renderOverview()

    expect(screen.getByText("Nenhum widget na visão geral")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Adicionar widget" }))
    expect(screen.getByRole("dialog", { name: "Adicionar widget" })).toBeInTheDocument()
  })
})

describe("matriz de acesso", () => {
  it("widget de módulo sem acesso não aparece nem no catálogo", async () => {
    blocked = new Set(["orcamento"])
    const { container } = await renderOverview()

    expect(column(container, "narrow")).toEqual(["team", "diary", "documents"])

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Adicionar widget" }))
    const catalog = screen.getByRole("dialog", { name: "Adicionar widget" })
    expect(within(catalog).queryByText("Últimas despesas")).not.toBeInTheDocument()
    expect(within(catalog).getByText("Minhas tarefas")).toBeInTheDocument()
  })

  it("o widget escondido pela permissão continua no layout salvo", async () => {
    blocked = new Set(["orcamento"])
    await renderOverview()

    await userEvent.click(screen.getByRole("button", { name: "Personalizar" }))
    await userEvent.click(screen.getByRole("button", { name: "Remover Equipe" }))
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(put).toHaveBeenCalled())
    expect(savedLayout().widgets.find((w) => w.id === "budget")).toEqual({ id: "budget", visible: true, size: "narrow" })
  })
})
