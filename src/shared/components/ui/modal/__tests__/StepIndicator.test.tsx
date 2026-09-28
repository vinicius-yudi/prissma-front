import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { StepIndicator } from "../StepIndicator"

const PASSOS = ["Endereço", "Dados", "Prazos"]

describe("<StepIndicator />", () => {
  it("lista todos os passos", () => {
    renderWithProviders(<StepIndicator steps={PASSOS} current={1} />)

    for (const passo of PASSOS) {
      expect(screen.getByText(passo)).toBeInTheDocument()
    }
  })

  // `current` é 1-based: o primeiro passo é 1, não 0. Um off-by-one aqui
  // marcaria o passo errado como atual em todo formulário de várias etapas.
  it("numera os passos ainda não alcançados a partir de 1", () => {
    renderWithProviders(<StepIndicator steps={PASSOS} current={1} />)

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  // Passo concluído troca o número pelo tique: é o sinal de que não precisa
  // mais de atenção.
  it("troca o número pelo tique nos passos já concluídos", () => {
    const { container } = renderWithProviders(<StepIndicator steps={PASSOS} current={3} />)

    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(screen.queryByText("2")).not.toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(container.querySelectorAll("svg")).toHaveLength(2)
  })

  it("desenha um conector a menos que a quantidade de passos", () => {
    const { container } = renderWithProviders(<StepIndicator steps={PASSOS} current={2} />)

    expect(container.querySelectorAll(".flex-1.h-0\\.5")).toHaveLength(2)
  })

  it("não desenha conector com um passo só", () => {
    const { container } = renderWithProviders(<StepIndicator steps={["Único"]} current={1} />)

    expect(container.querySelectorAll(".flex-1.h-0\\.5")).toHaveLength(0)
  })
})
