import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { StatusBadge } from "../StatusBadge"

/** Data no passado — o suficiente para o status derivar "Em atraso". */
const VENCIDO = "2020-01-01"
const FUTURO = "2099-12-31"

describe("<StatusBadge />", () => {
  // Um badge só para os três vocabulários do banco (obra, etapa, tarefa).
  it.each([
    ["obra concluída", "COMPLETED", "Concluída"],
    ["obra em andamento", "IN_PROGRESS", "Em andamento"],
    ["obra pausada", "PAUSED", "Pausada"],
    ["obra em planejamento", "PLANNING", "Não iniciada"],
    ["etapa concluída", "DONE", "Concluída"],
    ["etapa impedida", "BLOCKED", "Impedida"],
    ["obra cancelada", "CANCELLED", "Cancelada"],
  ])("traduz o status de %s", (_caso, status, rotulo) => {
    renderWithProviders(<StatusBadge status={status} />)

    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })

  /**
   * "Em atraso" não é status do banco: é derivado da data planejada contra
   * hoje. Uma tela que tratasse atraso como valor persistido divergiria das
   * outras.
   */
  it("mostra atraso quando o prazo passou, sobrepondo o status cru", () => {
    renderWithProviders(<StatusBadge status="IN_PROGRESS" plannedEndDate={VENCIDO} />)

    expect(screen.getByText("Em atraso")).toBeInTheDocument()
    expect(screen.queryByText("Em andamento")).not.toBeInTheDocument()
  })

  it("não acusa atraso dentro do prazo", () => {
    renderWithProviders(<StatusBadge status="IN_PROGRESS" plannedEndDate={FUTURO} />)

    expect(screen.getByText("Em andamento")).toBeInTheDocument()
  })

  // Obra concluída depois do prazo já terminou: acusar atraso ali seria cobrar
  // uma ação que não existe mais.
  it("não acusa atraso em status terminal, mesmo com prazo vencido", () => {
    renderWithProviders(<StatusBadge status="COMPLETED" plannedEndDate={VENCIDO} />)

    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  // §13: status nunca depende só de cor — sempre texto, ponto e, no atraso,
  // o símbolo de alerta.
  it("acompanha o ponto de estado além do texto", () => {
    const { container } = renderWithProviders(<StatusBadge status="DONE" />)

    expect(container.querySelector(".size-1\\.5")).toBeInTheDocument()
  })

  it("acrescenta o símbolo de alerta no atraso", () => {
    renderWithProviders(<StatusBadge status="IN_PROGRESS" plannedEndDate={VENCIDO} />)

    expect(screen.getByText("⚠")).toHaveAttribute("aria-hidden", "true")
  })

  // Sobre o <ContrastCard> as cores normais somem: a variante clara existe
  // para essa superfície.
  it.each(["default", "light"] as const)("aceita a variante %s", (variant) => {
    renderWithProviders(<StatusBadge status="DONE" variant={variant} />)

    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  it("aceita classe extra de quem monta", () => {
    renderWithProviders(<StatusBadge status="DONE" className="mt-4" />)

    expect(screen.getByText("Concluída")).toHaveClass("mt-4")
  })
})
