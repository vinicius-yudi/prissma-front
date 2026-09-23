import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { ThemeToggle } from "../ThemeToggle"

/** O botão é o único elemento interativo do componente. */
function botao() {
  return screen.getByRole("button")
}

describe("<ThemeToggle />", () => {
  // O rótulo anuncia o DESTINO, não o estado atual: no escuro, "Ativar modo
  // claro". Invertê-lo faria o leitor de tela dizer o oposto do que o clique faz.
  it("no tema escuro oferece o modo claro", () => {
    renderWithProviders(<ThemeToggle />)

    expect(botao()).toHaveAccessibleName("Ativar modo claro")
  })

  it("no tema claro oferece o modo escuro", async () => {
    renderWithProviders(<ThemeToggle />)

    await userEvent.click(botao())

    expect(botao()).toHaveAccessibleName("Ativar modo escuro")
  })

  it("alterna o tema no documento", async () => {
    renderWithProviders(<ThemeToggle />)
    expect(document.documentElement).toHaveAttribute("data-theme", "dark")

    await userEvent.click(botao())

    expect(document.documentElement).toHaveAttribute("data-theme", "light")
  })

  it("volta ao escuro no segundo clique", async () => {
    renderWithProviders(<ThemeToggle />)

    await userEvent.click(botao())
    await userEvent.click(botao())

    expect(document.documentElement).toHaveAttribute("data-theme", "dark")
  })

  // O botão desliza a manopla de um lado ao outro; a posição é o sinal visual
  // do estado, e o ícone acompanha.
  it("desloca a manopla ao trocar de tema", async () => {
    const { container } = renderWithProviders(<ThemeToggle />)
    const manopla = container.querySelector("span") as HTMLElement
    expect(manopla).toHaveStyle({ transform: "translateX(0)" })

    await userEvent.click(botao())

    expect(container.querySelector("span")).toHaveStyle({ transform: "translateX(1.25rem)" })
  })

  it("troca o ícone junto com o tema", async () => {
    const { container } = renderWithProviders(<ThemeToggle />)
    expect(container.querySelector(".lucide-moon")).toBeInTheDocument()

    await userEvent.click(botao())

    expect(container.querySelector(".lucide-sun")).toBeInTheDocument()
  })
})
