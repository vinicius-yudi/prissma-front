import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { Progress } from "../Progress"

/** Filho da trilha — é ele que carrega a largura e a trena. */
function preenchimento(container: HTMLElement): HTMLElement {
  return container.querySelector("[role=progressbar] > div") as HTMLElement
}

describe("<Progress />", () => {
  it("expõe o valor para leitor de tela", () => {
    renderWithProviders(<Progress value={42} />)

    const barra = screen.getByRole("progressbar")
    expect(barra).toHaveAttribute("aria-valuenow", "42")
    expect(barra).toHaveAttribute("aria-valuemin", "0")
    expect(barra).toHaveAttribute("aria-valuemax", "100")
  })

  it("nomeia a barra quando recebe rótulo", () => {
    renderWithProviders(<Progress value={42} label="Andamento da obra" />)

    expect(screen.getByRole("progressbar", { name: "Andamento da obra" })).toBeInTheDocument()
  })

  // O percentual vem de conta (gasto/planejado, etapas concluídas/total): um
  // estouro precisa achatar em 100 em vez de vazar a barra para fora da caixa.
  it.each([
    ["achata valor acima de 100", 130, "100"],
    ["achata valor negativo", -20, "0"],
    ["arredonda fração", 42.6, "43"],
  ])("%s", (_caso, valor, esperado) => {
    renderWithProviders(<Progress value={valor} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", esperado)
  })

  it("desenha a largura proporcional ao valor", () => {
    const { container } = renderWithProviders(<Progress value={30} />)

    expect(preenchimento(container)).toHaveStyle({ width: "30%" })
  })

  it("usa a altura padrão do design e aceita outra", () => {
    const { container, rerender } = renderWithProviders(<Progress value={30} />)
    expect(screen.getByRole("progressbar")).toHaveStyle({ height: "8px" })

    rerender(<Progress value={30} height={4} />)

    expect(container.querySelector("[role=progressbar]")).toHaveStyle({ height: "4px" })
  })

  /**
   * A trena (traços a cada 8px) é a assinatura da marca e vem empilhada sobre
   * a cor. Barra crua em qualquer outro lugar perde essa assinatura — por isso
   * o teste guarda a presença dela em todos os tons.
   */
  it.each(["gold", "ok", "warn", "danger"] as const)(
    "mantém a trena sobre o preenchimento do tom %s",
    (tone) => {
      const { container } = renderWithProviders(<Progress value={50} tone={tone} />)

      expect(preenchimento(container).style.backgroundImage).toContain("--pk-trena")
    },
  )

  it("aceita classe extra na trilha", () => {
    renderWithProviders(<Progress value={50} className="mt-2" />)

    expect(screen.getByRole("progressbar")).toHaveClass("mt-2")
  })
})
