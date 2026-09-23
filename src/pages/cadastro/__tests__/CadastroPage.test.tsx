import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HardHat } from "lucide-react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { CadastroPage } from "../index"
import { ReturnButton } from "../components/ReturnButton"
import { SelectionButton } from "../components/SelectionButton"

// Os três formulários compartilham hooks com rede; cada um tem seu teste de
// hook. Aqui a fronteira é a ESCOLHA do perfil e a volta.
vi.mock("../components/CadastroArquiteto", () => ({
  CadastroArquiteto: ({ onBack }: { onBack: () => void }) => (
    <button type="button" onClick={onBack}>
      form-arquiteto
    </button>
  ),
}))
vi.mock("../components/CadastroEngenheiro", () => ({
  CadastroEngenheiro: ({ onBack }: { onBack: () => void }) => (
    <button type="button" onClick={onBack}>
      form-engenheiro
    </button>
  ),
}))
vi.mock("../components/CadastroCliente", () => ({
  CadastroCliente: ({ onBack }: { onBack: () => void }) => (
    <button type="button" onClick={onBack}>
      form-cliente
    </button>
  ),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe("<CadastroPage />", () => {
  it("abre na escolha de perfil", () => {
    renderWithProviders(<CadastroPage />)

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
    expect(screen.queryByText("form-arquiteto")).not.toBeInTheDocument()
  })

  it.each([
    ["Arquiteto", "form-arquiteto"],
    ["Engenheiro", "form-engenheiro"],
    ["Cliente", "form-cliente"],
  ])("abre o formulário de %s", async (perfil, marcador) => {
    renderWithProviders(<CadastroPage />)

    await userEvent.click(screen.getByRole("button", { name: new RegExp(perfil, "i") }))

    expect(screen.getByText(marcador)).toBeInTheDocument()
  })

  it("volta para a escolha de perfil", async () => {
    renderWithProviders(<CadastroPage />)
    await userEvent.click(screen.getByRole("button", { name: /Arquiteto/i }))

    await userEvent.click(screen.getByText("form-arquiteto"))

    expect(screen.queryByText("form-arquiteto")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })

  it("oferece o atalho para quem já tem conta", () => {
    renderWithProviders(<CadastroPage />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/login")
  })
})

/**
 * São três botões lado a lado, então usam `outline`: o gradiente ouro é de uma
 * ação por vista, e em `primary` os três disputariam o mesmo destaque — além
 * de dispararem a guarda de tela do <Button>.
 */
describe("<SelectionButton />", () => {
  it("não usa o destaque primário", () => {
    renderWithProviders(
      <SelectionButton icon={HardHat} type="button">
        Arquiteto
      </SelectionButton>,
    )

    expect(screen.getByRole("button")).not.toHaveClass("bg-gold-grad")
  })

  it("dispara o clique de quem monta", async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <SelectionButton icon={HardHat} type="button" onClick={onClick}>
        Arquiteto
      </SelectionButton>,
    )

    await userEvent.click(screen.getByRole("button"))

    expect(onClick).toHaveBeenCalled()
  })
})

describe("<ReturnButton />", () => {
  it("desenha o rótulo e volta no clique", async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <ReturnButton icon={HardHat} type="button" onClick={onClick}>
        Voltar
      </ReturnButton>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }))

    expect(onClick).toHaveBeenCalled()
  })
})
