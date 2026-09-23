import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { BudgetItem } from "@/shared/types/budget"
import { renderWithProviders } from "@/test/renderWithProviders"

import { DONUT_COLORS, donutColor } from "../../utils/budgetChartColors"
import { BudgetCategoryBarChart } from "../BudgetCategoryBarChart"
import { BudgetCategoryDonut } from "../BudgetCategoryDonut"
import { BudgetCategoryDonutLegend } from "../BudgetCategoryDonutLegend"
import { BudgetCharts } from "../BudgetCharts"

/**
 * O Recharts mede o contêiner para desenhar, e no jsdom toda medida é 0 — o
 * SVG sai vazio. O que dá para verificar aqui é a decisão de MOSTRAR ou não o
 * gráfico e a legenda, que é onde mora a regra; a forma das barras é assunto
 * de olho humano.
 */

function categoria(over: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 3,
    projectBudgetId: 5,
    category: "Fundação",
    description: "",
    plannedAmount: 40_000,
    totalSpent: 10_000,
    remaining: 30_000,
    exceeded: false,
    ...over,
  }
}

describe("<BudgetCategoryDonut />", () => {
  // Donut sem fatia é um anel vazio: pior que ausência de gráfico.
  it("não desenha nada sem despesa lançada", () => {
    const { container } = renderWithProviders(
      <BudgetCategoryDonut items={[categoria({ totalSpent: 0 })]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("desenha quando há gasto", () => {
    const { container } = renderWithProviders(<BudgetCategoryDonut items={[categoria()]} />)

    expect(container).not.toBeEmptyDOMElement()
  })
})

describe("<BudgetCategoryDonutLegend />", () => {
  it("não desenha nada sem despesa lançada", () => {
    const { container } = renderWithProviders(
      <BudgetCategoryDonutLegend items={[categoria({ totalSpent: 0 })]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  // A legenda é a única leitura do donut acessível a leitor de tela e a quem
  // não distingue as cores.
  it("lista cada categoria com a fatia dela do gasto total", () => {
    renderWithProviders(
      <BudgetCategoryDonutLegend
        items={[
          categoria({ id: 1, category: "Fundação", totalSpent: 75 }),
          categoria({ id: 2, category: "Alvenaria", totalSpent: 25 }),
        ]}
      />,
    )

    expect(screen.getByText("Fundação")).toBeInTheDocument()
    expect(screen.getByText("75%")).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
  })

  it("ignora as categorias sem gasto no cálculo da fatia", () => {
    renderWithProviders(
      <BudgetCategoryDonutLegend
        items={[
          categoria({ id: 1, category: "Fundação", totalSpent: 100 }),
          categoria({ id: 2, category: "Alvenaria", totalSpent: 0 }),
        ]}
      />,
    )

    expect(screen.getByText("100%")).toBeInTheDocument()
    expect(screen.queryByText("Alvenaria")).not.toBeInTheDocument()
  })
})

describe("<BudgetCategoryBarChart />", () => {
  // Barra precisa de planejado OU gasto: categoria zerada nos dois é linha em
  // branco no eixo.
  it("não desenha nada quando nenhuma categoria tem valor", () => {
    const { container } = renderWithProviders(
      <BudgetCategoryBarChart items={[categoria({ plannedAmount: 0, totalSpent: 0 })]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("desenha com categoria que tem apenas valor planejado", () => {
    const { container } = renderWithProviders(
      <BudgetCategoryBarChart items={[categoria({ totalSpent: 0 })]} />,
    )

    expect(container).not.toBeEmptyDOMElement()
  })
})

describe("<BudgetCharts />", () => {
  it("some por inteiro enquanto nada foi gasto", () => {
    const { container } = renderWithProviders(
      <BudgetCharts items={[categoria({ totalSpent: 0 })]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("mostra os dois painéis quando há gasto", () => {
    renderWithProviders(<BudgetCharts items={[categoria()]} />)

    expect(screen.getByRole("heading", { name: "Gasto por categoria" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "% gasto vs planejado" })).toBeInTheDocument()
  })
})

/**
 * As cores são referência a variável CSS, não hex: é o que faz os gráficos
 * seguirem a troca de tema junto com o resto da interface, em vez de ficarem
 * congelados no modo escuro.
 */
describe("donutColor", () => {
  it("devolve variáveis CSS, nunca hex", () => {
    for (const cor of DONUT_COLORS) {
      expect(cor).toMatch(/^var\(--/)
    }
  })

  it("dá uma cor diferente para cada categoria da rampa", () => {
    expect(donutColor(0)).not.toBe(donutColor(1))
  })

  // Uma obra pode ter mais categorias que cores: dar `undefined` no índice 7
  // deixaria a fatia transparente.
  it("volta ao início da rampa quando as categorias passam das cores", () => {
    expect(donutColor(DONUT_COLORS.length)).toBe(donutColor(0))
  })
})
