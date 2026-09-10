import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import type { BudgetItem, Expense, ProjectBudget } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import type { Stage } from "../../services/stages.service"
import { BudgetDeleteConfirmModal } from "../BudgetDeleteConfirmModal"
import { BudgetFormModal } from "../BudgetFormModal"
import { BudgetItemFormModal } from "../BudgetItemFormModal"
import { ExpenseFormModal } from "../ExpenseFormModal"

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")

const onCreate = vi.fn()
const onUpdate = vi.fn()
const onClose = vi.fn()

const ORCAMENTO: ProjectBudget = {
  id: 5,
  constructionProjectId: 7,
  description: "Orçamento base",
  plannedTotal: 100_000,
  totalSpent: 0,
  remaining: 100_000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [],
}

const CATEGORIA: BudgetItem = {
  id: 3,
  projectBudgetId: 5,
  category: "Fundação",
  description: "Concreto e ferragem",
  plannedAmount: 40_000,
  totalSpent: 0,
  remaining: 40_000,
  exceeded: false,
}

const DESPESA: Expense = {
  id: 11,
  budgetItemId: 3,
  stageId: 1,
  description: "Compra de concreto",
  amount: 500,
  supplier: "Concreteira XYZ",
  receiptUrl: "https://nota.exemplo",
  spentAt: "2026-02-10",
  createdAt: "2026-02-10T00:00:00Z",
  categoryExceeded: false,
  budgetExceeded: false,
}

const ETAPA: Stage = {
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
}

function salvar() {
  return screen.getByRole("button", { name: "Salvar" })
}

beforeEach(() => {
  vi.resetAllMocks()
  onCreate.mockResolvedValue(undefined)
  onUpdate.mockResolvedValue(undefined)
})

describe("<BudgetFormModal />", () => {
  const props = { onClose, onCreate, onUpdate, isSubmitting: false }

  it("não renderiza nada fechado", () => {
    renderWithProviders(<BudgetFormModal open={false} budget={null} {...props} />)

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("abre em branco para criar", () => {
    renderWithProviders(<BudgetFormModal open budget={null} {...props} />)

    expect(screen.getByRole("heading", { name: "Criar orçamento" })).toBeInTheDocument()
  })

  // O mesmo modal serve para criar e editar: sem o preenchimento, salvar
  // apagaria a descrição que já existia.
  it("abre preenchido para editar", () => {
    renderWithProviders(<BudgetFormModal open budget={ORCAMENTO} {...props} />)

    expect(screen.getByRole("heading", { name: "Editar orçamento" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Orçamento base")).toBeInTheDocument()
    expect(screen.getByDisplayValue("100000")).toBeInTheDocument()
  })

  it("cria com o que foi digitado e fecha", async () => {
    renderWithProviders(<BudgetFormModal open budget={null} {...props} />)

    await userEvent.type(screen.getByRole("spinbutton"), "50000")
    await userEvent.click(salvar())

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ plannedTotal: 50_000 })),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it("edita pela rota do orçamento existente", async () => {
    renderWithProviders(<BudgetFormModal open budget={ORCAMENTO} {...props} />)

    await userEvent.click(salvar())

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(5, expect.anything()))
  })

  // O hook já mostra o toast do erro do servidor; o modal fica aberto para o
  // usuário corrigir em vez de perder o que digitou.
  it("mantém o modal aberto quando a gravação falha", async () => {
    onCreate.mockRejectedValue(new Error("Erro 500"))
    renderWithProviders(<BudgetFormModal open budget={null} {...props} />)

    await userEvent.click(salvar())

    await waitFor(() => expect(onCreate).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it("desabilita os botões durante a gravação", () => {
    renderWithProviders(<BudgetFormModal open budget={null} {...props} isSubmitting />)

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
  })

  it("fecha no cancelar", async () => {
    renderWithProviders(<BudgetFormModal open budget={null} {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onClose).toHaveBeenCalled()
  })
})

describe("<BudgetItemFormModal />", () => {
  const props = { onClose, onCreate, onUpdate, isSubmitting: false }

  it("abre preenchido para editar a categoria", () => {
    renderWithProviders(<BudgetItemFormModal open item={CATEGORIA} {...props} />)

    expect(screen.getByRole("heading", { name: "Editar categoria" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Fundação")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Concreto e ferragem")).toBeInTheDocument()
  })

  it("cria a categoria com nome e valor", async () => {
    renderWithProviders(<BudgetItemFormModal open item={null} {...props} />)

    await userEvent.type(screen.getByPlaceholderText("Ex: Fundação"), "Alvenaria")
    await userEvent.type(
      screen.getByPlaceholderText("Ex: Concreto, ferragem e mão de obra"),
      "Blocos",
    )
    await userEvent.type(screen.getByRole("spinbutton"), "9000")
    await userEvent.click(salvar())

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        category: "Alvenaria",
        description: "Blocos",
        plannedAmount: 9000,
      }),
    )
  })

  /**
   * Erro de campo vai no campo; o toast aqui é o resumo de um formulário
   * submetido inválido — sem ele, clicar em Salvar num modal rolado não daria
   * retorno nenhum.
   */
  it("avisa por toast quando o formulário é submetido inválido", async () => {
    renderWithProviders(<BudgetItemFormModal open item={null} {...props} />)

    await userEvent.click(salvar())

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("edita pela rota da categoria existente", async () => {
    renderWithProviders(<BudgetItemFormModal open item={CATEGORIA} {...props} />)

    await userEvent.click(salvar())

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(3, expect.anything()))
  })
})

describe("<ExpenseFormModal />", () => {
  const props = { onClose, onCreate, onUpdate, isSubmitting: false, stages: [ETAPA] }

  it("abre preenchida para editar a despesa", () => {
    renderWithProviders(<ExpenseFormModal open expense={DESPESA} {...props} />)

    expect(screen.getByRole("heading", { name: "Editar despesa" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Compra de concreto")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Concreteira XYZ")).toBeInTheDocument()
    expect(screen.getByDisplayValue("https://nota.exemplo")).toBeInTheDocument()
  })

  /**
   * A despesa quase sempre é lançada no dia: abrir com a data em branco
   * obrigaria a digitar a de hoje em todo lançamento.
   *
   * O dia é o LOCAL, montado à mão aqui em vez de `toISOString()`: à noite no
   * Brasil o UTC já virou, e o campo abriria com a data de amanhã.
   */
  it("abre com a data local de hoje ao criar", () => {
    renderWithProviders(<ExpenseFormModal open expense={null} {...props} />)

    const agora = new Date()
    const hoje = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, "0"),
      String(agora.getDate()).padStart(2, "0"),
    ].join("-")
    expect(screen.getByDisplayValue(hoje)).toBeInTheDocument()
  })

  it("lista as etapas da obra e a opção de não vincular", () => {
    renderWithProviders(<ExpenseFormModal open expense={null} {...props} />)

    expect(screen.getByRole("option", { name: "Sem etapa vinculada" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Fundação" })).toBeInTheDocument()
  })

  // O `<select>` devolve string; o payload precisa de número ou null, senão o
  // backend recebe "1" e recusa.
  it("converte a etapa escolhida para número", async () => {
    renderWithProviders(<ExpenseFormModal open expense={null} {...props} />)

    await userEvent.type(screen.getByPlaceholderText(/5m³ de concreto/), "Concreto")
    await userEvent.type(screen.getByRole("spinbutton"), "500")
    await userEvent.selectOptions(screen.getByRole("combobox"), "1")
    await userEvent.click(salvar())

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ stageId: 1 })),
    )
  })

  it("manda etapa nula quando nenhuma foi escolhida", async () => {
    renderWithProviders(<ExpenseFormModal open expense={null} {...props} />)

    await userEvent.type(screen.getByPlaceholderText(/5m³ de concreto/), "Concreto")
    await userEvent.type(screen.getByRole("spinbutton"), "500")
    await userEvent.click(salvar())

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ stageId: null })),
    )
  })

  it("recusa despesa de valor zero", async () => {
    renderWithProviders(<ExpenseFormModal open expense={null} {...props} />)

    await userEvent.type(screen.getByPlaceholderText(/5m³ de concreto/), "Concreto")
    await userEvent.click(salvar())

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("edita pela rota da despesa existente", async () => {
    renderWithProviders(<ExpenseFormModal open expense={DESPESA} {...props} />)

    await userEvent.click(salvar())

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(11, expect.anything()))
  })
})

/**
 * Um modal só para as três exclusões: o texto muda com o alvo, mas o fluxo
 * (confirmar, bloquear durante a gravação, cancelar) é o mesmo — três modais
 * quase iguais divergiriam no primeiro ajuste.
 */
describe("<BudgetDeleteConfirmModal />", () => {
  const onConfirm = vi.fn()
  const props = { isSubmitting: false, onClose, onConfirm }

  it("fica fechado sem alvo", () => {
    renderWithProviders(<BudgetDeleteConfirmModal target={null} {...props} />)

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it.each([
    ["budget", "Excluir orçamento"],
    ["item", "Excluir categoria"],
    ["expense", "Excluir despesa"],
  ] as const)("titula a exclusão de %s", (kind, titulo) => {
    renderWithProviders(<BudgetDeleteConfirmModal target={{ kind, id: 1 }} {...props} />)

    expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument()
  })

  it("confirma a exclusão", async () => {
    renderWithProviders(
      <BudgetDeleteConfirmModal target={{ kind: "item", id: 3 }} {...props} />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it("bloqueia os dois botões durante a exclusão", () => {
    renderWithProviders(
      <BudgetDeleteConfirmModal target={{ kind: "item", id: 3 }} {...props} isSubmitting />,
    )

    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
  })
})
