import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Filter } from "lucide-react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { DimensionLine } from "../dimension-line/DimensionLine"
import { Num } from "../num/Num"
import { Select } from "../select/Select"
import { Textarea } from "../textarea/Textarea"
import { UnavailableBadge } from "../unavailable-badge/UnavailableBadge"

/**
 * Primitivos do kit: componentes de uma responsabilidade só, cada um com uma
 * regra do Style Guide que o teste guarda. Ficam juntos porque cada um tem
 * duas ou três asserções e um arquivo por primitivo seria só cerimônia.
 */

describe("<Num />", () => {
  // Valor de dado sempre estreito e tabular, para a coluna não dançar quando
  // o número muda.
  it("desenha o valor em número tabular", () => {
    render(<Num>R$ 1.240,00</Num>)

    expect(screen.getByText("R$ 1.240,00")).toHaveClass("t-num")
  })

  it("repassa classe e atributos de quem monta", () => {
    render(
      <Num className="text-xl" data-testid="valor">
        42
      </Num>,
    )

    expect(screen.getByTestId("valor")).toHaveClass("text-xl")
  })
})

describe("<DimensionLine />", () => {
  // Cota: valores em número tabular nas pontas do fio.
  it("desenha a cota com os valores em t-data", () => {
    render(<DimensionLine>OBRA-042 · Rua das Palmeiras</DimensionLine>)

    expect(screen.getByText("OBRA-042 · Rua das Palmeiras").closest("p")).toHaveClass("t-data")
  })

  it("mostra a medida na outra ponta quando vem", () => {
    render(<DimensionLine measure="186 m²">OBRA-042</DimensionLine>)

    expect(screen.getByText("186 m²")).toBeInTheDocument()
  })

  it("aceita classe extra", () => {
    render(<DimensionLine className="mt-1">OBRA-042</DimensionLine>)

    expect(screen.getByText("OBRA-042").closest("p")).toHaveClass("mt-1")
  })
})

describe("<UnavailableBadge />", () => {
  // Item cinza sem explicação lê como bug; com o selo, lê como roadmap.
  it("mostra o selo traduzido", () => {
    renderWithProviders(<UnavailableBadge />)

    expect(screen.getByText("Indisponível")).toBeInTheDocument()
  })
})

describe("<Textarea />", () => {
  it("nasce com três linhas e aceita outra quantidade", () => {
    const { rerender } = render(<Textarea aria-label="Descrição" />)
    expect(screen.getByLabelText("Descrição")).toHaveAttribute("rows", "3")

    rerender(<Textarea aria-label="Descrição" rows={8} />)

    expect(screen.getByLabelText("Descrição")).toHaveAttribute("rows", "8")
  })

  it("aceita digitação e repassa o handler", async () => {
    const onChange = vi.fn()
    render(<Textarea aria-label="Descrição" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText("Descrição"), "chuva")

    expect(onChange).toHaveBeenCalled()
    expect(screen.getByLabelText("Descrição")).toHaveValue("chuva")
  })

  // O react-hook-form registra o campo pela ref: sem o forwardRef o valor
  // nunca chegaria no submit.
  it("encaminha a ref para o elemento nativo", () => {
    const ref = createRef<HTMLTextAreaElement>()

    render(<Textarea ref={ref} aria-label="Descrição" />)

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})

describe("<Select />", () => {
  it("renderiza as opções recebidas", () => {
    render(
      <Select aria-label="Etapa" defaultValue="1">
        <option value="1">Fundação</option>
        <option value="2">Alvenaria</option>
      </Select>,
    )

    expect(screen.getByLabelText("Etapa")).toHaveValue("1")
    expect(screen.getByRole("option", { name: "Alvenaria" })).toBeInTheDocument()
  })

  it("troca o valor selecionado", async () => {
    render(
      <Select aria-label="Etapa" defaultValue="1">
        <option value="1">Fundação</option>
        <option value="2">Alvenaria</option>
      </Select>,
    )

    await userEvent.selectOptions(screen.getByLabelText("Etapa"), "2")

    expect(screen.getByLabelText("Etapa")).toHaveValue("2")
  })

  // O ícone de prefixo é posicionado sobre o campo: sem o recuo extra o texto
  // da opção passa por baixo dele.
  it("abre espaço à esquerda quando há prefixo", () => {
    const { rerender } = render(
      <Select aria-label="Etapa" prefix={<Filter data-testid="prefixo" />}>
        <option value="1">Fundação</option>
      </Select>,
    )
    expect(screen.getByTestId("prefixo")).toBeInTheDocument()
    expect(screen.getByLabelText("Etapa")).toHaveClass("pl-10")

    rerender(
      <Select aria-label="Etapa">
        <option value="1">Fundação</option>
      </Select>,
    )

    expect(screen.getByLabelText("Etapa")).not.toHaveClass("pl-10")
  })
})
