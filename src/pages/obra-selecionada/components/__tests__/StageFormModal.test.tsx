import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  createStage,
  deleteStage,
  listStages,
  updateStage,
  type Stage,
} from "../../services/stages.service"
import { StageFormModal } from "../StageFormModal"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const criar = vi.mocked(createStage)
const editar = vi.mocked(updateStage)
const excluir = vi.mocked(deleteStage)

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: "Sapatas",
    displayOrder: 2,
    status: EtapaStatus.IN_PROGRESS,
    plannedStartDate: "2026-03-01T00:00:00Z",
    plannedEndDate: "2026-03-20T00:00:00Z",
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

const onClose = vi.fn()

interface Opts {
  stage?: Stage | null
  stages?: Stage[]
  projectStartDate?: string | null
  canMutate?: boolean
  suggestedDisplayOrder?: number
}

function render({
  stage = null,
  stages = [],
  projectStartDate = null,
  canMutate = true,
  suggestedDisplayOrder = 1,
}: Opts = {}) {
  return renderWithProviders(
    <StageFormModal
      open
      onClose={onClose}
      projectId={7}
      projectStartDate={projectStartDate}
      stages={stages}
      stage={stage}
      suggestedDisplayOrder={suggestedDisplayOrder}
      canMutate={canMutate}
    />,
  )
}

/**
 * Os campos são buscados por tipo, não por rótulo: os <Label> do formulário
 * não têm `htmlFor` nem envolvem o input, então `getByLabelText` não os
 * alcança — o mesmo motivo pelo qual um leitor de tela também não os associa.
 */
function datas(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]'))
}

function inicio() {
  return datas()[0]
}

function fim() {
  return datas()[1]
}

function ordem() {
  return screen.getByRole("spinbutton")
}

/** Preenche o mínimo que o schema exige para o submit passar. */
async function preencherMinimo(de = "2026-03-01", ate = "2026-03-20") {
  await userEvent.type(screen.getByPlaceholderText("Ex.: Fundação"), "Alvenaria")
  await userEvent.type(inicio(), de)
  await userEvent.type(fim(), ate)
}

function salvar() {
  return userEvent.click(screen.getByRole("button", { name: "Salvar" }))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listStages).mockResolvedValue([])
  criar.mockResolvedValue(etapa())
  editar.mockResolvedValue(etapa())
  excluir.mockResolvedValue(undefined)
})

describe("<StageFormModal /> — abertura", () => {
  it("não renderiza nada fechado", () => {
    renderWithProviders(
      <StageFormModal
        open={false}
        onClose={onClose}
        projectId={7}
        projectStartDate={null}
        stages={[]}
        canMutate
      />,
    )

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  // A ordem sugerida é a última + 1: abrir sempre em 1 empurraria a etapa nova
  // para o começo do ciclo.
  it("abre em branco na ordem sugerida para criar", () => {
    render({ suggestedDisplayOrder: 4 })

    expect(screen.getByRole("heading", { name: "Nova etapa" })).toBeInTheDocument()
    expect(ordem()).toHaveValue(4)
  })

  it("abre preenchido para editar", () => {
    render({ stage: etapa() })

    expect(screen.getByRole("heading", { name: "Editar etapa" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Fundação")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Sapatas")).toBeInTheDocument()
  })

  // O backend devolve data-hora ISO; o `<input type="date">` só aceita a data.
  it("recorta a hora das datas vindas do servidor", () => {
    render({ stage: etapa() })

    expect(inicio()).toHaveValue("2026-03-01")
    expect(fim()).toHaveValue("2026-03-20")
  })

  it("deixa tudo em leitura para quem não pode editar", () => {
    render({ stage: etapa(), canMutate: false })

    expect(screen.getByDisplayValue("Fundação")).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
  })
})

describe("<StageFormModal /> — gravação", () => {
  it("cria a etapa com o que foi preenchido", async () => {
    render()

    await preencherMinimo()
    await salvar()

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][1]).toMatchObject({
      name: "Alvenaria",
      plannedStartDate: "2026-03-01",
      plannedEndDate: "2026-03-20",
      status: EtapaStatus.PLANNED,
    })
    expect(onClose).toHaveBeenCalled()
  })

  // Descrição em branco vai como null, não como string vazia: o backend
  // distingue "sem descrição" de "descrição vazia".
  it("manda descrição nula quando o campo fica vazio", async () => {
    render()

    await preencherMinimo()
    await salvar()

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][1].description).toBeNull()
  })

  it("edita pela rota da própria etapa", async () => {
    render({ stage: etapa() })

    await salvar()

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0][0]).toBe(1)
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
 * As três regras de cronologia são validadas aqui além do backend porque cada
 * uma pede uma correção diferente do usuário — um 400 genérico não diria qual
 * data mexer.
 */
describe("<StageFormModal /> — cronologia", () => {
  it("recusa etapa que começa antes da obra", async () => {
    render({ projectStartDate: "2026-06-01" })

    await preencherMinimo("2026-03-01", "2026-03-20")
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A etapa não pode começar antes do início da obra.",
      ),
    )
    expect(criar).not.toHaveBeenCalled()
  })

  it("exige que a etapa anterior tenha data de início", async () => {
    render({
      suggestedDisplayOrder: 2,
      stages: [etapa({ id: 9, displayOrder: 1, plannedStartDate: null })],
    })

    await preencherMinimo()
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A etapa anterior precisa ter uma data de início antes desta etapa.",
      ),
    )
  })

  it("recusa etapa que começa antes da anterior", async () => {
    render({
      suggestedDisplayOrder: 2,
      stages: [etapa({ id: 9, displayOrder: 1, plannedStartDate: "2026-05-01" })],
    })

    await preencherMinimo("2026-03-01", "2026-03-20")
    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A etapa não pode começar antes da etapa anterior.",
      ),
    )
  })

  // A "anterior" é a de maior ordem ABAIXO desta, não a primeira da lista —
  // e a própria etapa em edição nunca conta como sua antecessora.
  it("compara com a etapa imediatamente anterior, ignorando a própria", async () => {
    render({
      stage: etapa({ id: 1, displayOrder: 3, plannedStartDate: "2026-01-01" }),
      stages: [
        etapa({ id: 1, displayOrder: 3, plannedStartDate: "2026-01-01" }),
        etapa({ id: 8, displayOrder: 1, plannedStartDate: "2026-01-01" }),
        etapa({ id: 9, displayOrder: 2, plannedStartDate: "2026-05-01" }),
      ],
    })

    await salvar()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A etapa não pode começar antes da etapa anterior.",
      ),
    )
  })

  it("aceita a primeira etapa da obra sem antecessora", async () => {
    render({ projectStartDate: "2026-01-01", suggestedDisplayOrder: 1 })

    await preencherMinimo()
    await salvar()

    await waitFor(() => expect(criar).toHaveBeenCalled())
  })
})

describe("<StageFormModal /> — exclusão", () => {
  it("não oferece excluir ao criar", () => {
    render()

    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
  })

  it("troca o formulário pela confirmação", async () => {
    render({ stage: etapa() })

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    expect(screen.getByRole("heading", { name: "Excluir etapa" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Editar etapa" })).not.toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()
  })

  it("exclui e fecha o modal ao confirmar", async () => {
    render({ stage: etapa() })
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(1))
    expect(onClose).toHaveBeenCalled()
  })

  it("volta ao formulário ao cancelar a exclusão", async () => {
    render({ stage: etapa() })
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.getByRole("heading", { name: "Editar etapa" })).toBeInTheDocument()
    expect(excluir).not.toHaveBeenCalled()
  })

  it("mantém o modal aberto quando a exclusão falha", async () => {
    excluir.mockRejectedValue(new Error("Etapa com tarefas."))
    render({ stage: etapa() })
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(excluir).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })
})
