import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { HeaderSearch } from "../HeaderSearch"

/** Espelha a URL corrente para conferir navegação e query string. */
function UrlSpy() {
  const { pathname, search } = useLocation()
  return <span data-testid="url">{pathname + search}</span>
}

function render(route: string) {
  return renderWithProviders(
    <>
      <HeaderSearch />
      <UrlSpy />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </>,
    { route },
  )
}

function campo() {
  return screen.getByRole("searchbox", { name: "Buscar obras..." })
}

function url() {
  return screen.getByTestId("url").textContent
}

describe("<HeaderSearch /> — fora de /obras", () => {
  it("começa vazio", () => {
    render("/dashboard")

    expect(campo()).toHaveValue("")
  })

  // Fora de /obras não há lista para filtrar em tempo real: o que se digita
  // fica local e só vira URL no Enter.
  it("não mexe na URL enquanto se digita", async () => {
    render("/dashboard")

    await userEvent.type(campo(), "alfa")

    expect(campo()).toHaveValue("alfa")
    expect(url()).toBe("/dashboard")
  })

  it("leva para a lista de obras com o termo no Enter", async () => {
    render("/dashboard")

    await userEvent.type(campo(), "alfa{Enter}")

    expect(url()).toBe("/obras?q=alfa")
  })

  it("escapa caracteres especiais do termo", async () => {
    render("/dashboard")

    await userEvent.type(campo(), "rua a&b{Enter}")

    expect(url()).toBe("/obras?q=rua%20a%26b")
  })

  it("vai para a lista sem query quando o campo está vazio", async () => {
    render("/dashboard")

    await userEvent.type(campo(), "{Enter}")

    expect(url()).toBe("/obras")
  })
})

/**
 * Em /obras o valor exibido É a URL — sem cópia local não há o que
 * sincronizar quando o termo muda por fora (voltar do navegador, link colado).
 */
describe("<HeaderSearch /> — dentro de /obras", () => {
  it("abre já preenchido com o termo da URL", () => {
    render("/obras?q=alfa")

    expect(campo()).toHaveValue("alfa")
  })

  it("escreve na URL a cada tecla, para a lista filtrar em tempo real", async () => {
    render("/obras")

    await userEvent.type(campo(), "al")

    expect(url()).toBe("/obras?q=al")
  })

  it("apaga o parâmetro quando o campo esvazia, em vez de deixar q=", async () => {
    render("/obras?q=alfa")

    await userEvent.clear(campo())

    expect(url()).toBe("/obras")
  })
})

describe("<HeaderSearch /> — botão de limpar", () => {
  it("não aparece com o campo vazio", () => {
    render("/obras")

    expect(screen.queryByRole("button", { name: "Limpar busca" })).not.toBeInTheDocument()
  })

  it("limpa o termo e a URL", async () => {
    render("/obras?q=alfa")

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }))

    expect(campo()).toHaveValue("")
    expect(url()).toBe("/obras")
  })

  it("limpa o rascunho local fora de /obras", async () => {
    render("/dashboard")
    await userEvent.type(campo(), "alfa")

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }))

    expect(campo()).toHaveValue("")
  })
})
