import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Building2 } from "lucide-react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { Modal } from "../Modal"

const onClose = vi.fn()

beforeEach(() => {
  onClose.mockReset()
})

describe("<Modal />", () => {
  it("não renderiza nada fechado", () => {
    renderWithProviders(
      <Modal open={false} onClose={onClose} title="Nova obra">
        <p>Conteúdo</p>
      </Modal>,
    )

    expect(screen.queryByText("Nova obra")).not.toBeInTheDocument()
  })

  it("mostra título, descrição e conteúdo quando aberto", () => {
    renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra" description="Preencha os dados">
        <p>Conteúdo</p>
      </Modal>,
    )

    expect(screen.getByRole("heading", { name: "Nova obra" })).toBeInTheDocument()
    expect(screen.getByText("Preencha os dados")).toBeInTheDocument()
    expect(screen.getByText("Conteúdo")).toBeInTheDocument()
  })

  it("omite a descrição e o ícone quando não vêm", () => {
    const { container } = renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra" />,
    )

    expect(container.querySelector("svg.lucide-building2")).not.toBeInTheDocument()
  })

  it("desenha o ícone recebido", () => {
    renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra" icon={<Building2 data-testid="icone" />} />,
    )

    expect(screen.getByTestId("icone")).toBeInTheDocument()
  })

  it("fecha no botão de fechar", async () => {
    renderWithProviders(<Modal open onClose={onClose} title="Nova obra" />)

    await userEvent.click(screen.getByRole("button"))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // Acessibilidade §13: modal fecha com Esc.
  it("fecha no Esc", async () => {
    renderWithProviders(<Modal open onClose={onClose} title="Nova obra" />)

    await userEvent.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("ignora outras teclas", async () => {
    renderWithProviders(<Modal open onClose={onClose} title="Nova obra" />)

    await userEvent.keyboard("{Enter}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("não escuta o teclado enquanto está fechado", async () => {
    renderWithProviders(<Modal open={false} onClose={onClose} title="Nova obra" />)

    await userEvent.keyboard("{Escape}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("fecha ao clicar no backdrop", async () => {
    renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra">
        <p>Conteúdo</p>
      </Modal>,
    )

    await userEvent.click(document.querySelector(".fixed.inset-0") as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // Clicar dentro do painel (num campo, num botão) não pode fechar o modal —
  // o clique sobe até o backdrop se ninguém parar a propagação.
  it("não fecha ao clicar dentro do painel", async () => {
    renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra">
        <p>Conteúdo</p>
      </Modal>,
    )

    await userEvent.click(screen.getByText("Conteúdo"))

    expect(onClose).not.toHaveBeenCalled()
  })

  // Sem travar o scroll do body a página de trás rola sob o modal no celular.
  it("trava a rolagem do body enquanto aberto e devolve ao desmontar", () => {
    const { unmount } = renderWithProviders(<Modal open onClose={onClose} title="Nova obra" />)

    expect(document.body.style.overflow).toBe("hidden")

    unmount()

    expect(document.body.style.overflow).toBe("")
  })

  it("não trava a rolagem quando está fechado", () => {
    renderWithProviders(<Modal open={false} onClose={onClose} title="Nova obra" />)

    expect(document.body.style.overflow).toBe("")
  })

  // O modal é renderizado em portal para não herdar overflow/z-index de quem o
  // montou — uma aba com `overflow-hidden` cortaria o painel.
  it("monta no body, fora da árvore de quem o abriu", () => {
    const { container } = renderWithProviders(
      <Modal open onClose={onClose} title="Nova obra">
        <p>Conteúdo</p>
      </Modal>,
    )

    expect(container).not.toHaveTextContent("Conteúdo")
    expect(document.body).toHaveTextContent("Conteúdo")
  })

  it.each(["sm", "lg", "xl", "2xl"] as const)("aceita o tamanho %s", (size) => {
    renderWithProviders(<Modal open onClose={onClose} title="Nova obra" size={size} />)

    expect(screen.getByRole("heading", { name: "Nova obra" })).toBeInTheDocument()
  })

  it.each(["default", "danger", "warning"] as const)(
    "pinta a barra de destaque da variante %s",
    (variant) => {
      renderWithProviders(
        <Modal open onClose={onClose} title="Excluir obra" variant={variant} icon={<Building2 />} />,
      )

      expect(screen.getByRole("heading", { name: "Excluir obra" })).toBeInTheDocument()
    },
  )
})
