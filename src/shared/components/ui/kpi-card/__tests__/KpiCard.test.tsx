import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { KpiCard } from "../KpiCard"

describe("<KpiCard />", () => {
  it("mostra rótulo e valor", () => {
    renderWithProviders(<KpiCard label="Gasto total" value="R$ 25.000" />)

    expect(screen.getByText("Gasto total")).toBeInTheDocument()
    expect(screen.getByText("R$ 25.000")).toBeInTheDocument()
  })

  // Style Guide §3: moeda, percentual e contador vão em mono; texto corrido
  // nunca. O valor passa obrigatoriamente pelo <Num>.
  it("desenha o valor em mono, e o rótulo não", () => {
    renderWithProviders(<KpiCard label="Gasto total" value="R$ 25.000" />)

    expect(screen.getByText("R$ 25.000")).toHaveClass("font-mono")
    expect(screen.getByText("Gasto total")).not.toHaveClass("font-mono")
  })

  it("omite a variação quando ela não vem", () => {
    renderWithProviders(<KpiCard label="Gasto total" value="R$ 25.000" />)

    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument()
  })

  // §6: a variação carrega o sinal além da cor — daltônico não perde a
  // informação.
  it("mostra a variação com o sinal recebido", () => {
    renderWithProviders(
      <KpiCard label="Gasto total" value="R$ 25.000" delta={{ text: "▲ 18%" }} />,
    )

    expect(screen.getByText("▲ 18%")).toBeInTheDocument()
  })

  it.each(["ok", "warn", "danger", "neutral"] as const)("aceita o tom %s na variação", (tone) => {
    renderWithProviders(
      <KpiCard label="Gasto total" value="R$ 25.000" delta={{ text: "▼ 5%", tone }} />,
    )

    expect(screen.getByText("▼ 5%")).toBeInTheDocument()
  })

  it("desenha o conteúdo auxiliar quando existe", () => {
    renderWithProviders(
      <KpiCard label="Gasto total" value="R$ 25.000">
        <span>3 categorias</span>
      </KpiCard>,
    )

    expect(screen.getByText("3 categorias")).toBeInTheDocument()
  })

  it("aceita classe extra no card", () => {
    const { container } = renderWithProviders(
      <KpiCard label="Gasto" value="R$ 1" className="col-span-2" />,
    )

    expect(container.firstElementChild).toHaveClass("col-span-2")
  })
})
