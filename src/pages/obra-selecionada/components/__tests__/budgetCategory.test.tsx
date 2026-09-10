import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import type { BudgetItem, Expense } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listExpenses } from "../../services/budget.service"
import type { Stage } from "../../services/stages.service"
import { BudgetCategoryCard } from "../BudgetCategoryCard"
import { BudgetCategoryExpenses } from "../BudgetCategoryExpenses"
import { BudgetCategoryHeader } from "../BudgetCategoryHeader"
import { BudgetCategoryList } from "../BudgetCategoryList"
import { BudgetCategoryMenu } from "../BudgetCategoryMenu"
import { ExpenseRow } from "../ExpenseRow"

vi.mock("../../services/budget.service", () => ({
  listExpenses: vi.fn(),
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
}))

const listarDespesas = vi.mocked(listExpenses)

function categoria(over: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 3,
    projectBudgetId: 5,
    category: "Fundação",
    description: "Concreto e ferragem",
    plannedAmount: 40_000,
    totalSpent: 10_000,
    remaining: 30_000,
    exceeded: false,
    ...over,
  }
}

function despesa(over: Partial<Expense> = {}): Expense {
  return {
    id: 11,
    budgetItemId: 3,
    stageId: null,
    description: "Compra de concreto",
    amount: 500,
    supplier: null,
    receiptUrl: null,
    spentAt: "2026-02-10",
    createdAt: "2026-02-10T00:00:00Z",
    categoryExceeded: false,
    budgetExceeded: false,
    ...over,
  }
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

beforeEach(() => {
  vi.resetAllMocks()
  listarDespesas.mockResolvedValue([])
})

describe("<BudgetCategoryHeader />", () => {
  const onToggle = vi.fn()

  it("mostra categoria, descrição e o percentual gasto", () => {
    renderWithProviders(
      <BudgetCategoryHeader item={categoria()} expanded={false} onToggle={onToggle} />,
    )

    expect(screen.getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
    expect(screen.getByText("Concreto e ferragem")).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
  })

  it("omite a descrição quando ela está vazia", () => {
    renderWithProviders(
      <BudgetCategoryHeader
        item={categoria({ description: "" })}
        expanded={false}
        onToggle={onToggle}
      />,
    )

    expect(screen.queryByText("Concreto e ferragem")).not.toBeInTheDocument()
  })

  // O acordeão é um botão: `aria-expanded` é o que o leitor de tela anuncia.
  it("anuncia se está aberto ou fechado", () => {
    const { rerender } = renderWithProviders(
      <BudgetCategoryHeader item={categoria()} expanded={false} onToggle={onToggle} />,
    )
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByRole("button")).toHaveAccessibleName("Expandir")

    rerender(<BudgetCategoryHeader item={categoria()} expanded onToggle={onToggle} />)

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button")).toHaveAccessibleName("Recolher")
  })

  it("marca a categoria estourada no selo", () => {
    renderWithProviders(
      <BudgetCategoryHeader
        item={categoria({ exceeded: true })}
        expanded={false}
        onToggle={onToggle}
      />,
    )

    expect(screen.getByText("Estourado")).toBeInTheDocument()
  })

  it("abre no clique", async () => {
    renderWithProviders(
      <BudgetCategoryHeader item={categoria()} expanded={false} onToggle={onToggle} />,
    )

    await userEvent.click(screen.getByRole("button"))

    expect(onToggle).toHaveBeenCalled()
  })
})

describe("<BudgetCategoryMenu />", () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()

  it("começa fechado", () => {
    renderWithProviders(<BudgetCategoryMenu onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.queryByText("Editar categoria")).not.toBeInTheDocument()
  })

  it("abre e fecha no próprio botão", async () => {
    renderWithProviders(<BudgetCategoryMenu onEdit={onEdit} onDelete={onDelete} />)

    await userEvent.click(screen.getByLabelText("menu"))
    expect(screen.getByText("Editar categoria")).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText("menu"))
    expect(screen.queryByText("Editar categoria")).not.toBeInTheDocument()
  })

  // O menu fecha ao escolher: deixá-lo aberto sobre o modal que acabou de
  // abrir empilharia duas camadas de UI.
  it.each([
    ["Editar categoria", onEdit],
    ["Excluir categoria", onDelete],
  ])("dispara %s e fecha o menu", async (rotulo, handler) => {
    renderWithProviders(<BudgetCategoryMenu onEdit={onEdit} onDelete={onDelete} />)
    await userEvent.click(screen.getByLabelText("menu"))

    await userEvent.click(screen.getByText(rotulo))

    expect(handler).toHaveBeenCalled()
    expect(screen.queryByText(rotulo)).not.toBeInTheDocument()
  })
})

describe("<ExpenseRow />", () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const props = { canMutate: true, onEdit, onDelete }

  it("mostra data, descrição e valor", () => {
    renderWithProviders(<ExpenseRow expense={despesa()} {...props} />)

    expect(screen.getByText("Compra de concreto")).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  // Fornecedor e etapa são opcionais no backend; a linha precisa dizer isso em
  // vez de deixar dois espaços em branco.
  it("preenche fornecedor e etapa ausentes com texto explícito", () => {
    renderWithProviders(<ExpenseRow expense={despesa()} {...props} />)

    expect(screen.getByText("Sem fornecedor")).toBeInTheDocument()
    expect(screen.getByText("Sem etapa")).toBeInTheDocument()
  })

  it("trata fornecedor só de espaços como ausente", () => {
    renderWithProviders(<ExpenseRow expense={despesa({ supplier: "   " })} {...props} />)

    expect(screen.getByText("Sem fornecedor")).toBeInTheDocument()
  })

  it("mostra fornecedor e etapa quando existem", () => {
    renderWithProviders(
      <ExpenseRow expense={despesa({ supplier: "Concreteira XYZ" })} stageName="Fundação" {...props} />,
    )

    expect(screen.getByText("Concreteira XYZ")).toBeInTheDocument()
    expect(screen.getByText("Fundação")).toBeInTheDocument()
  })

  // O comprovante abre em aba nova: `noopener` evita que a página aberta
  // alcance a nossa por `window.opener`.
  it("liga o comprovante em aba nova e protegida", () => {
    renderWithProviders(
      <ExpenseRow expense={despesa({ receiptUrl: "https://nota.exemplo" })} {...props} />,
    )

    const link = screen.getByRole("link", { name: /Comprovante/ })
    expect(link).toHaveAttribute("href", "https://nota.exemplo")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("omite o link quando não há comprovante", () => {
    renderWithProviders(<ExpenseRow expense={despesa()} {...props} />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("esconde as ações de quem não pode editar", () => {
    renderWithProviders(<ExpenseRow expense={despesa()} {...props} canMutate={false} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("entrega a despesa inteira ao editar e ao excluir", async () => {
    const gasto = despesa()
    renderWithProviders(<ExpenseRow expense={gasto} {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Editar despesa" }))
    await userEvent.click(screen.getByRole("button", { name: "Excluir despesa" }))

    expect(onEdit).toHaveBeenCalledWith(gasto)
    expect(onDelete).toHaveBeenCalledWith(gasto)
  })
})

describe("<BudgetCategoryExpenses />", () => {
  const props = {
    item: categoria(),
    stages: [ETAPA],
    canMutate: true,
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it("mostra o esqueleto enquanto carrega", () => {
    listarDespesas.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithProviders(
      <BudgetCategoryExpenses {...props} enabled />,
    )

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("avisa quando a categoria não tem despesa", async () => {
    renderWithProviders(<BudgetCategoryExpenses {...props} enabled />)

    expect(
      await screen.findByText("Nenhuma despesa lançada nesta categoria."),
    ).toBeInTheDocument()
  })

  // A linha só conhece o id da etapa; o nome vem da lista que o pai já tem —
  // buscar etapa por despesa seria uma requisição por linha.
  it("resolve o nome da etapa a partir do id da despesa", async () => {
    listarDespesas.mockResolvedValue([despesa({ stageId: 1 })])

    renderWithProviders(<BudgetCategoryExpenses {...props} enabled />)

    expect(await screen.findByText("Fundação")).toBeInTheDocument()
  })
})

describe("<BudgetCategoryCard />", () => {
  const handlers = {
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddExpense: vi.fn(),
    onEditExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
  }

  it("não busca despesas com o card fechado", () => {
    renderWithProviders(
      <BudgetCategoryCard
        item={categoria()}
        stages={[ETAPA]}
        expanded={false}
        canMutate
        {...handlers}
      />,
    )

    expect(listarDespesas).not.toHaveBeenCalled()
  })

  it("carrega as despesas quando o card abre", async () => {
    renderWithProviders(
      <BudgetCategoryCard item={categoria()} stages={[ETAPA]} expanded canMutate {...handlers} />,
    )

    expect(listarDespesas).toHaveBeenCalledWith(3)
    expect(await screen.findByText(/Nenhuma despesa/)).toBeInTheDocument()
  })

  it("esconde o menu de quem não pode editar", () => {
    renderWithProviders(
      <BudgetCategoryCard
        item={categoria()}
        stages={[ETAPA]}
        expanded={false}
        canMutate={false}
        {...handlers}
      />,
    )

    expect(screen.queryByLabelText("menu")).not.toBeInTheDocument()
  })

  // O banner de estouro leva para a categoria por âncora: sem o id o link
  // não teria destino.
  it("carrega o id de âncora usado pelo banner de estouro", () => {
    const { container } = renderWithProviders(
      <BudgetCategoryCard
        item={categoria()}
        stages={[ETAPA]}
        expanded={false}
        canMutate
        {...handlers}
      />,
    )

    expect(container.querySelector("#budget-category-3")).toBeInTheDocument()
  })
})

describe("<BudgetCategoryList />", () => {
  const handlers = {
    isExpanded: () => false,
    onToggle: vi.fn(),
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    onAddExpense: vi.fn(),
    onEditExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
  }

  it("avisa quando o orçamento ainda não tem categoria", () => {
    renderWithProviders(
      <BudgetCategoryList items={[]} stages={[]} canMutate {...handlers} />,
    )

    expect(screen.getByText("Nenhuma despesa lançada nesta categoria.")).toBeInTheDocument()
  })

  it("desenha um card por categoria", () => {
    renderWithProviders(
      <BudgetCategoryList
        items={[categoria(), categoria({ id: 4, category: "Alvenaria" })]}
        stages={[]}
        canMutate
        {...handlers}
      />,
    )

    expect(screen.getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Alvenaria" })).toBeInTheDocument()
  })

  // Os handlers do pai recebem o item; a lista é quem fecha a closure com ele.
  it("entrega a categoria certa ao editar", async () => {
    const item = categoria()
    renderWithProviders(
      <BudgetCategoryList items={[item]} stages={[]} canMutate {...handlers} />,
    )

    await userEvent.click(screen.getByLabelText("menu"))
    await userEvent.click(screen.getByText("Editar categoria"))

    expect(handlers.onEditItem).toHaveBeenCalledWith(item)
  })
})
