import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "../ThemeContext"

/**
 * O tema não é só uma classe: ele grava a escolha, escreve `data-theme` na
 * raiz (é dali que todo o CSS lê) e liga uma classe de transição temporária.
 * Os três precisam andar juntos — um tema salvo que não chega ao `<html>`
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

afterEach(() => {
  vi.useRealTimers()
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

  // A transição vive numa classe TEMPORÁRIA. Se ela ficasse no CSS base, todo
  // hover e foco do app ficaria mole e o primeiro paint entraria desbotando.
  it("liga a classe de transição e a remove depois", async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains("theme-transition")).toBe(true)

    act(() => vi.advanceTimersByTime(350))
    expect(document.documentElement.classList.contains("theme-transition")).toBe(false)
  })

  // Dois cliques rápidos: o segundo precisa reiniciar o relógio, senão o
  // primeiro timer apaga a classe no meio da segunda transição.
  it("reinicia o relógio quando alterna de novo antes do fim", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.toggleTheme())
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current.toggleTheme())
    act(() => vi.advanceTimersByTime(200))

    expect(document.documentElement.classList.contains("theme-transition")).toBe(true)

    act(() => vi.advanceTimersByTime(150))
    expect(document.documentElement.classList.contains("theme-transition")).toBe(false)
  })

  it("cancela o timer pendente no unmount", () => {
    vi.useFakeTimers()
    const clearTimeout = vi.spyOn(window, "clearTimeout")
    const { result, unmount } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.toggleTheme())
    unmount()

    expect(clearTimeout).toHaveBeenCalled()
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
