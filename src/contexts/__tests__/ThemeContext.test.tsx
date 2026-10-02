import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "../ThemeContext"

/**
 * O tema não é só um estado: ele grava a escolha e escreve `data-theme` na
 * raiz (é dali que todo o CSS lê). Os dois precisam andar juntos — um tema salvo que não chega ao `<html>`
 * deixa a tela clara com o valor "dark" guardado.
 */

const STORAGE_KEY = "prissma-theme"

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme")
  document.documentElement.className = ""
})

describe("tema inicial", () => {
  it("começa no escuro quando nada foi salvo", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe("dark")
  })

  it("respeita o tema salvo", () => {
    localStorage.setItem(STORAGE_KEY, "light")

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe("light")
  })

  // Valor estranho no storage (edição manual, versão antiga) não pode deixar
  // o app sem tema: cai no padrão.
  it("ignora valor inválido no storage", () => {
    localStorage.setItem(STORAGE_KEY, "sepia")

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe("dark")
  })

  it("escreve data-theme na raiz já no primeiro render", () => {
    renderHook(() => useTheme(), { wrapper })

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
  })
})

describe("toggleTheme", () => {
  it("alterna entre claro e escuro", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => result.current.toggleTheme())
    expect(result.current.theme).toBe("light")

    await act(async () => result.current.toggleTheme())
    expect(result.current.theme).toBe("dark")
  })

  it("persiste a escolha e reflete na raiz", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => result.current.toggleTheme())

    expect(localStorage.getItem(STORAGE_KEY)).toBe("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
  })

  // A troca acontece dentro de uma View Transition quando o navegador oferece:
  // o estado e o `data-theme` precisam já estar trocados quando o callback
  // termina, senão o cross-fade anima para o tema antigo.
  it("troca o tema dentro de startViewTransition quando disponível", async () => {
    const startViewTransition = vi.fn((callback: () => void) => {
      callback()
      return {} as ViewTransition
    })
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    })
    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => result.current.toggleTheme())

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
    expect(result.current.theme).toBe("light")

    Reflect.deleteProperty(document, "startViewTransition")
  })

  // Movimento reduzido: nada de cross-fade, a troca é instantânea.
  it("não usa View Transition com movimento reduzido", async () => {
    const startViewTransition = vi.fn()
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    })
    const matchMedia = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList)
    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => result.current.toggleTheme())

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(result.current.theme).toBe("light")

    matchMedia.mockRestore()
    Reflect.deleteProperty(document, "startViewTransition")
  })
})

describe("useTheme fora do provider", () => {
  // Falhar alto é melhor que devolver um tema padrão silencioso: o componente
  // renderizaria com a cor errada e ninguém saberia por quê.
  it("lança erro explicando o que falta", () => {
    const erroSilenciado = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used within ThemeProvider")

    erroSilenciado.mockRestore()
  })
})

describe("integração com um componente", () => {
  it("um botão consegue trocar o tema da árvore inteira", async () => {
    const user = userEvent.setup()

    function Botao() {
      const { theme, toggleTheme } = useTheme()
      return <button onClick={toggleTheme}>tema: {theme}</button>
    }

    render(
      <ThemeProvider>
        <Botao />
      </ThemeProvider>,
    )

    expect(screen.getByRole("button")).toHaveTextContent("tema: dark")
    await user.click(screen.getByRole("button"))

    expect(screen.getByRole("button")).toHaveTextContent("tema: light")
  })
})
