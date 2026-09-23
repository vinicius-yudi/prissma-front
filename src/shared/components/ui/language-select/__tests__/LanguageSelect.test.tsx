import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18N_STORAGE_KEY } from "@/lib/i18n"
import { renderWithProviders } from "@/test/renderWithProviders"

import { LanguageSelect } from "../LanguageSelect"

// A bandeira SVG do react-country-flag não acrescenta nada à asserção e
// carrega um <svg> por idioma; o stub deixa o país visível como texto.
vi.mock("react-country-flag", () => ({
  default: ({ countryCode }: { countryCode: string }) => <i data-testid={`flag-${countryCode}`} />,
}))

// O componente troca o idioma da instância global do i18n. Sem devolver ao pt,
// o próximo teste do arquivo começaria em inglês.
afterEach(async () => {
  const { testI18n } = await import("@/test/i18n")
  await testI18n.changeLanguage("pt")
})

/** O gatilho é o primeiro botão; abertos, os três idiomas entram depois dele. */
function gatilho() {
  return screen.getAllByRole("button")[0]
}

function abrirMenu() {
  return userEvent.click(gatilho())
}

describe("<LanguageSelect />", () => {
  it("mostra o idioma atual no gatilho e nada mais", () => {
    renderWithProviders(<LanguageSelect />)

    expect(screen.getByText("pt")).toBeInTheDocument()
    expect(screen.queryByText("English")).not.toBeInTheDocument()
  })

  it("lista os três idiomas ao abrir", async () => {
    renderWithProviders(<LanguageSelect />)

    await abrirMenu()

    expect(screen.getByText("Português")).toBeInTheDocument()
    expect(screen.getByText("English")).toBeInTheDocument()
    expect(screen.getByText("Español")).toBeInTheDocument()
  })

  it("fecha ao clicar no gatilho de novo", async () => {
    renderWithProviders(<LanguageSelect />)
    await abrirMenu()

    await abrirMenu()

    expect(screen.queryByText("English")).not.toBeInTheDocument()
  })

  it.each([
    ["English", "en"],
    ["Español", "es"],
    ["Português", "pt"],
  ])("troca para %s e fecha o menu", async (rotulo, codigo) => {
    renderWithProviders(<LanguageSelect />)
    await abrirMenu()

    await userEvent.click(screen.getByText(rotulo))

    expect(screen.queryByText("English")).not.toBeInTheDocument()
    expect(localStorage.getItem(I18N_STORAGE_KEY)).toBe(codigo)
  })

  // A escolha precisa sobreviver ao recarregamento: sem gravar, todo F5
  // voltaria para o português.
  it("guarda a escolha para a próxima visita", async () => {
    renderWithProviders(<LanguageSelect />)
    await abrirMenu()

    await userEvent.click(screen.getByText("English"))

    expect(localStorage.getItem(I18N_STORAGE_KEY)).toBe("en")
  })

  // O menu flutua sobre a tela: sem fechar no clique fora, ele ficaria
  // pendurado enquanto o usuário interage com o resto.
  it("fecha ao clicar fora", async () => {
    renderWithProviders(
      <div>
        <LanguageSelect />
        <button type="button">Fora</button>
      </div>,
    )
    await abrirMenu()

    await userEvent.click(screen.getByRole("button", { name: "Fora" }))

    expect(screen.queryByText("English")).not.toBeInTheDocument()
  })

  // Só o clique FORA fecha: um clique na moldura do painel (entre as opções)
  // não pode descartar o menu que o usuário acabou de abrir.
  it("continua aberto ao clicar na moldura do menu", async () => {
    const { container } = renderWithProviders(<LanguageSelect />)
    await abrirMenu()

    await userEvent.click(container.querySelector(".absolute") as HTMLElement)

    expect(screen.getByText("English")).toBeInTheDocument()
  })
})
