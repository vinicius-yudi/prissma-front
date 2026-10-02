import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { Progress } from "../Progress"

/** Primeiro filho do trilho — é ele que carrega a largura. */
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
    expect(screen.getByRole("progressbar")).toHaveStyle({ height: "10px" })

    rerender(<Progress value={30} height={4} />)

    expect(container.querySelector("[role=progressbar]")).toHaveStyle({ height: "4px" })
  })

  /**
   * As marcações da trena são a assinatura da marca e ficam sobre qualquer tom.
   * Na variante fina (< 8px) somem: ali viram ruído.
   */
  it.each(["gold", "ok", "warn", "danger"] as const)(
    "mantém as marcações da trena no tom %s",
    (tone) => {
      const { container } = renderWithProviders(<Progress value={50} tone={tone} />)

      expect(container.querySelector("[data-ticks]")).toBeInTheDocument()
    },
  )

  it("tira as marcações da variante fina", () => {
    const { container } = renderWithProviders(<Progress value={50} height={6} />)

    expect(container.querySelector("[data-ticks]")).not.toBeInTheDocument()
  })

  // O marcador ▾ mostra onde a obra deveria estar hoje.
  it("posiciona o marcador de esperado quando há prazo", () => {
    const { container } = renderWithProviders(<Progress value={30} expected={48} />)

    expect(container.querySelector("[data-expected]")).toHaveStyle({ left: "48%" })
  })

  it("omite o marcador sem prazo", () => {
    const { container } = renderWithProviders(<Progress value={30} />)

    expect(container.querySelector("[data-expected]")).not.toBeInTheDocument()
  })

  it("aceita classe extra no contêiner", () => {
    const { container } = renderWithProviders(<Progress value={50} className="mt-2" />)

    expect(container.firstElementChild).toHaveClass("mt-2")
  })
})
