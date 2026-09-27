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
    ["etapa impedida", "BLOCKED", "Pausada"],
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

  // §13: status nunca depende só de cor — sempre texto e ponto.
  it("acompanha o ponto de estado além do texto", () => {
    const { container } = renderWithProviders(<StatusBadge status="DONE" />)

    expect(container.querySelector(".size-1\\.5")).toBeInTheDocument()
  })

  // DS v2: só a tarefa fica "Bloqueada", com listras de sinalização que a
  // separam de "Em atraso". Etapa com impedimento aparece como pausada.
  it("marca tarefa bloqueada com listras e rótulo próprio", () => {
    renderWithProviders(<StatusBadge status="BLOCKED" kind="task" />)

    expect(screen.getByText("Bloqueada")).toHaveClass("hazard")
  })

  // "Em andamento" é o único status em ouro, e o ponto pulsa.
  it("pulsa o ponto só em andamento", () => {
    const { container, rerender } = renderWithProviders(<StatusBadge status="IN_PROGRESS" />)
    expect(container.querySelector(".live-dot")).toBeInTheDocument()

    rerender(<StatusBadge status="DONE" />)

    expect(container.querySelector(".live-dot")).not.toBeInTheDocument()
  })

  it("aceita classe extra de quem monta", () => {
    renderWithProviders(<StatusBadge status="DONE" className="mt-4" />)

    expect(screen.getByText("Concluída")).toHaveClass("mt-4")
  })
})
