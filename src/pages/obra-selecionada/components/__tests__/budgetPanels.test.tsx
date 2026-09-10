import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Coins } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import type { BudgetItem, ProjectBudget } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import { BudgetChartPanel } from "../BudgetChartPanel"
import { BudgetEmptyState } from "../BudgetEmptyState"
import { BudgetErrorState } from "../BudgetErrorState"
import { BudgetExceededBanner } from "../BudgetExceededBanner"
import { BudgetKpiCard } from "../BudgetKpiCard"
import { BudgetKpiStrip } from "../BudgetKpiStrip"
import { BudgetLoadingState } from "../BudgetLoadingState"
import { BudgetMainPanel } from "../BudgetMainPanel"
import { BudgetProgressBar } from "../BudgetProgressBar"
import { BudgetStatusPill } from "../BudgetStatusPill"

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

function orcamento(over: Partial<ProjectBudget> = {}): ProjectBudget {
  return {
    id: 5,
    constructionProjectId: 7,
    description: "Orçamento base",
    plannedTotal: 100_000,
    totalSpent: 25_000,
    remaining: 75_000,
    exceeded: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    items: [],
    ...over,
  }
}

describe("<BudgetKpiCard />", () => {
  it("mostra rótulo e valor em mono", () => {
    renderWithProviders(
      <BudgetKpiCard label="Planejado" value="R$ 100.000" icon={<Coins />} />,
    )

    expect(screen.getByText("Planejado")).toBeInTheDocument()
    expect(screen.getByText("R$ 100.000")).toHaveClass("font-mono")
  })

  it("omite a nota de rodapé quando não vem", () => {
    renderWithProviders(<BudgetKpiCard label="Estouros" value={0} icon={<Coins />} />)

    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it.each(["default", "warning", "danger"] as const)("aceita o destaque %s", (accent) => {
    renderWithProviders(
      <BudgetKpiCard label="Gasto" value="R$ 1" icon={<Coins />} accent={accent} hint="nota" />,
    )

    expect(screen.getByText("nota")).toBeInTheDocument()
  })
})

describe("<BudgetKpiStrip />", () => {
  it("mostra os quatro indicadores do orçamento", () => {
    renderWithProviders(<BudgetKpiStrip budget={orcamento()} />)

    expect(screen.getByText("Planejado")).toBeInTheDocument()
    expect(screen.getByText("Gasto")).toBeInTheDocument()
    expect(screen.getByText("Restante")).toBeInTheDocument()
    expect(screen.getByText("Estouros")).toBeInTheDocument()
  })

  it("calcula o percentual utilizado", () => {
    renderWithProviders(<BudgetKpiStrip budget={orcamento()} />)

    expect(screen.getByText("25% do orçamento utilizado")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25")
  })

  it("conta as categorias estouradas e explica quantas são", () => {
    renderWithProviders(
      <BudgetKpiStrip
        budget={orcamento({ items: [categoria({ exceeded: true }), categoria({ id: 4 })] })}
      />,
    )

    // Regex e não texto exato: o componente usa a chave `exceededOther` para
    // qualquer contagem, então com uma só ainda sai "1 categorias". A
    // contagem é o que o teste garante; o plural é outra conversa.
    expect(screen.getByText(/^1 categorias?$/)).toBeInTheDocument()
  })

  it("não mostra nota de estouro quando está tudo em dia", () => {
    renderWithProviders(<BudgetKpiStrip budget={orcamento({ items: [categoria()] })} />)

    expect(screen.queryByText(/categorias?$/)).not.toBeInTheDocument()
  })
})

/**
 * A barra de orçamento é só a tradução do tom para o <Progress> — que é o
 * único componente autorizado a desenhar barra, e o que carrega a trena da
 * marca.
 */
describe("<BudgetProgressBar />", () => {
  it("desenha a barra do sistema com o valor", () => {
    renderWithProviders(<BudgetProgressBar percent={62} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "62")
  })

  it.each([
    ["sm", "6px"],
    ["md", "8px"],
    ["lg", "12px"],
  ] as const)("aplica a altura %s", (height, px) => {
    renderWithProviders(<BudgetProgressBar percent={50} height={height} />)

    expect(screen.getByRole("progressbar")).toHaveStyle({ height: px })
  })

  // `calculatePercent` divide por zero quando o planejado é 0: um NaN aqui
  // zeraria a largura sem avisar.
  it("cai em zero quando o percentual não é finito", () => {
    renderWithProviders(<BudgetProgressBar percent={Number.NaN} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")
  })

  it("aceita o tom explícito no lugar do derivado", () => {
    renderWithProviders(<BudgetProgressBar percent={10} tone="exceeded" label="Fundação" />)

    expect(screen.getByRole("progressbar", { name: "Fundação" })).toBeInTheDocument()
  })
})

describe("<BudgetStatusPill />", () => {
  it.each([
    ["ok", "Em dia"],
    ["warning", "Próximo do limite"],
    ["exceeded", "Estourado"],
  ] as const)("traduz o tom %s", (tone, rotulo) => {
    renderWithProviders(<BudgetStatusPill tone={tone} />)

    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })
})

describe("<BudgetEmptyState />", () => {
  it("explica o que falta e oferece criar", async () => {
    const onCreate = vi.fn()
    renderWithProviders(<BudgetEmptyState canMutate onCreate={onCreate} />)

    await userEvent.click(screen.getByRole("button", { name: "Criar orçamento" }))

    expect(screen.getByRole("heading", { name: "Nenhum orçamento criado" })).toBeInTheDocument()
    expect(onCreate).toHaveBeenCalled()
  })

  // Quem não pode criar vê a explicação sem o botão: um botão que só dá 403 é
  // pior que nenhum.
  it("esconde o botão de quem não pode criar", () => {
    renderWithProviders(<BudgetEmptyState canMutate={false} onCreate={vi.fn()} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("<BudgetErrorState />", () => {
  it("oferece tentar de novo", async () => {
    const onRetry = vi.fn()
    renderWithProviders(<BudgetErrorState onRetry={onRetry} />)

    await userEvent.click(screen.getByRole("button"))

    expect(onRetry).toHaveBeenCalled()
  })
})

describe("<BudgetLoadingState /> e <BudgetChartPanel />", () => {
  it("desenha o esqueleto de carregamento", () => {
    const { container } = renderWithProviders(<BudgetLoadingState />)

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("titula o painel de gráfico e mostra o conteúdo", () => {
    renderWithProviders(
      <BudgetChartPanel title="Gasto por categoria">
        <div>gráfico</div>
      </BudgetChartPanel>,
    )

    expect(screen.getByRole("heading", { name: "Gasto por categoria" })).toBeInTheDocument()
    expect(screen.getByText("gráfico")).toBeInTheDocument()
  })
})

/**
 * Estouro é condição, não evento: o banner permanece na tela enquanto durar.
 * Um toast de 3 segundos é o que faz o usuário descobrir o problema só no
 * fechamento do mês.
 */
describe("<BudgetExceededBanner />", () => {
  const onReview = vi.fn()

  it("some quando nenhuma categoria estourou", () => {
    const { container } = renderWithProviders(
      <BudgetExceededBanner budget={orcamento({ items: [categoria()] })} onReview={onReview} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("aponta a categoria de maior desvio absoluto, não a primeira da lista", () => {
    renderWithProviders(
      <BudgetExceededBanner
        budget={orcamento({
          items: [
            categoria({ id: 1, category: "Elétrica", plannedAmount: 100, totalSpent: 200, exceeded: true }),
            categoria({ id: 2, category: "Fundação", plannedAmount: 100, totalSpent: 900, exceeded: true }),
          ],
        })}
        onReview={onReview}
      />,
    )

    expect(screen.getByText(/Fundação/)).toBeInTheDocument()
  })

  it("mostra previsto, executado e o desvio", () => {
    renderWithProviders(
      <BudgetExceededBanner
        budget={orcamento({
          items: [categoria({ plannedAmount: 1000, totalSpent: 1500, exceeded: true })],
        })}
        onReview={onReview}
      />,
    )

    expect(screen.getByText(/\+.*500/)).toBeInTheDocument()
  })

  it("avisa quantas outras categorias também estouraram", () => {
    renderWithProviders(
      <BudgetExceededBanner
        budget={orcamento({
          items: [
            categoria({ id: 1, exceeded: true, totalSpent: 90_000 }),
            categoria({ id: 2, exceeded: true, totalSpent: 50_000 }),
            categoria({ id: 3, exceeded: true, totalSpent: 45_000 }),
          ],
        })}
        onReview={onReview}
      />,
    )

    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it("leva à categoria pior ao clicar em revisar", async () => {
    renderWithProviders(
      <BudgetExceededBanner
        budget={orcamento({ items: [categoria({ id: 9, exceeded: true })] })}
        onReview={onReview}
      />,
    )

    await userEvent.click(screen.getByRole("button"))

    expect(onReview).toHaveBeenCalledWith(9)
  })
})

describe("<BudgetMainPanel />", () => {
  const acoes = {
    onAddItem: vi.fn(),
    onEditBudget: vi.fn(),
    onDeleteBudget: vi.fn(),
  }

  it("mostra o título e a descrição do orçamento", () => {
    renderWithProviders(
      <BudgetMainPanel budget={orcamento()} canMutate {...acoes} />,
    )

    expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument()
    expect(screen.getByText("Orçamento base")).toBeInTheDocument()
  })

  it("omite a linha de descrição quando ela está vazia", () => {
    renderWithProviders(
      <BudgetMainPanel budget={orcamento({ description: null })} canMutate {...acoes} />,
    )

    expect(screen.queryByText("Orçamento base")).not.toBeInTheDocument()
  })

  it("esconde as ações de quem não pode editar", () => {
    renderWithProviders(
      <BudgetMainPanel budget={orcamento()} canMutate={false} {...acoes} />,
    )

    expect(screen.queryByRole("button", { name: "Nova categoria" })).not.toBeInTheDocument()
  })

  it("cria categoria pelo botão do cabeçalho", async () => {
    renderWithProviders(<BudgetMainPanel budget={orcamento()} canMutate {...acoes} />)

    await userEvent.click(screen.getByRole("button", { name: "Nova categoria" }))

    expect(acoes.onAddItem).toHaveBeenCalled()
  })
})
