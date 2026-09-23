import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Button } from "../../button/Button"
import { ContrastCard } from "../../contrast-card/ContrastCard"
import { DimensionLine } from "../../dimension-line/DimensionLine"
import { PageChromeProvider } from "../PageChrome"

/**
 * A guarda existe para que as regras "no máximo um por tela" do Style Guide
 * não se dissolvam conforme as telas crescem. Ela só reclama em
 * desenvolvimento e some fora do provider — telas públicas (login, cadastro)
 * montam os mesmos componentes sem shell.
 */

let erro: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  erro = vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  erro.mockRestore()
})

describe("<PageChromeProvider />", () => {
  it("aceita uma ocorrência de cada slot em silêncio", () => {
    render(
      <PageChromeProvider>
        <DimensionLine>OBRA-042</DimensionLine>
        <ContrastCard>Tarefas de hoje</ContrastCard>
        <Button>Salvar</Button>
      </PageChromeProvider>,
    )

    expect(erro).not.toHaveBeenCalled()
  })

  it.each([
    ["a linha de cota", <DimensionLine key="d">OBRA-042</DimensionLine>],
    ["o card de contraste", <ContrastCard key="c">Tarefas</ContrastCard>],
    ["o botão primário", <Button key="b">Salvar</Button>],
  ])("reclama quando %s aparece duas vezes", (_caso, elemento) => {
    render(
      <PageChromeProvider>
        {elemento}
        {elemento}
      </PageChromeProvider>,
    )

    expect(erro).toHaveBeenCalledWith(expect.stringContaining("2x nesta tela"))
  })

  // Só o `primary` disputa o destaque: uma tela cheia de botões de contorno é
  // normal, e reclamar deles tornaria o aviso ruído.
  it("não reclama de vários botões que não são primários", () => {
    render(
      <PageChromeProvider>
        <Button variant="outline">Cancelar</Button>
        <Button variant="ghost">Ver todas</Button>
        <Button variant="destructive">Excluir</Button>
      </PageChromeProvider>,
    )

    expect(erro).not.toHaveBeenCalled()
  })

  // Desmontar um modal com botão primário precisa liberar o slot, senão a
  // segunda abertura acusa duplicidade que não existe.
  it("libera o slot quando o componente desmonta", () => {
    const { unmount } = render(
      <PageChromeProvider>
        <DimensionLine>OBRA-042</DimensionLine>
      </PageChromeProvider>,
    )
    unmount()

    render(
      <PageChromeProvider>
        <DimensionLine>OBRA-042</DimensionLine>
      </PageChromeProvider>,
    )

    expect(erro).not.toHaveBeenCalled()
  })

  it("vira no-op fora do provider, para as telas sem shell", () => {
    render(
      <>
        <Button>Entrar</Button>
        <Button>Cadastrar</Button>
      </>,
    )

    expect(erro).not.toHaveBeenCalled()
    expect(screen.getAllByRole("button")).toHaveLength(2)
  })
})
