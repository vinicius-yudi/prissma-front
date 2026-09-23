import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { BrandPanel } from "../BrandPanel"
import { ConstructionHero } from "../ConstructionHero"
import { HolographicBuildingOverlay } from "../HolographicBuildingOverlay"

/**
 * O painel de marca das telas públicas é decoração: não tem estado nem
 * interação. O que os testes guardam é que ele não tem texto fora do `t()`,
 * que a cena inteira é inerte para leitor de tela e cursor, e que a torre
 * holográfica é determinística — ela é desenhada com constantes calculadas, e
 * um `Math.random` ali faria o desenho piscar a cada render.
 */

describe("<BrandPanel />", () => {
  it("mostra a marca e a headline traduzidas", () => {
    renderWithProviders(<BrandPanel />)

    expect(screen.getByText("PRISSMA")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("desenha a cena de obra dentro do painel", () => {
    const { container } = renderWithProviders(<BrandPanel />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  // As texturas cobrem o painel inteiro: sem `pointer-events-none` elas
  // engoliriam o clique de qualquer coisa por baixo.
  it("mantém as texturas fora do alcance do cursor", () => {
    const { container } = renderWithProviders(<BrandPanel />)

    for (const seletor of [".bg-blueprint-grid", ".bg-brand-glow", ".bg-brand-fade"]) {
      expect(container.querySelector(seletor)).toHaveClass("pointer-events-none")
    }
  })
})

describe("<ConstructionHero />", () => {
  it("empilha as camadas da cena e a torre", () => {
    const { container } = renderWithProviders(<ConstructionHero />)

    expect(container.querySelector(".bg-hero-sky")).toBeInTheDocument()
    expect(container.querySelector(".bg-hero-ground")).toBeInTheDocument()
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  // O painel pode ficar à direita do formulário; a torre é contra-espelhada
  // para a grua não trocar de lado.
  it("espelha as camadas quando pedido", () => {
    const { container } = renderWithProviders(<ConstructionHero mirror />)

    expect(container.querySelectorAll(".-scale-x-100")).toHaveLength(2)
  })

  it("não espelha nada por padrão", () => {
    const { container } = renderWithProviders(<ConstructionHero />)

    expect(container.querySelectorAll(".-scale-x-100")).toHaveLength(0)
  })
})

describe("<HolographicBuildingOverlay />", () => {
  it("é inerte para o leitor de tela — é ilustração, não conteúdo", () => {
    const { container } = renderWithProviders(<HolographicBuildingOverlay />)

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  // Sem determinismo o prédio mudaria de painéis acesos a cada render e
  // piscaria na hidratação.
  it("desenha exatamente o mesmo traço em dois renders", () => {
    const primeiro = renderWithProviders(<HolographicBuildingOverlay />).container.innerHTML
    const segundo = renderWithProviders(<HolographicBuildingOverlay />).container.innerHTML

    expect(segundo).toBe(primeiro)
  })

  it("desenha a fachada inteira: lajes, colunas e nós", () => {
    const { container } = renderWithProviders(<HolographicBuildingOverlay />)

    expect(container.querySelectorAll("line").length).toBeGreaterThan(30)
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0)
  })
})
