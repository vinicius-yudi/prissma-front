import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useMediaQuery } from "../useMediaQuery"
import { useMountEffect } from "../useMountEffect"

/**
 * `matchMedia` de mentira com listeners de verdade: dá para virar o resultado
 * e disparar o `change`, que é o comportamento que o hook realmente assina.
 * O stub global do setup.ts devolve `matches: false` fixo e não notifica.
 */
function stubMatchMedia() {
  const listeners = new Map<string, Set<() => void>>()
  const estado = new Map<string, boolean>()

  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return estado.get(query) ?? false
    },
    media: query,
    addEventListener: (_evento: string, cb: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(cb)
    },
    removeEventListener: (_evento: string, cb: () => void) => {
      listeners.get(query)?.delete(cb)
    },
  }))

  vi.stubGlobal("matchMedia", matchMedia)
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: matchMedia })

  return {
    matchMedia,
    set(query: string, valor: boolean) {
      estado.set(query, valor)
      act(() => {
        listeners.get(query)?.forEach((cb) => cb())
      })
    },
    listenersDe: (query: string) => listeners.get(query)?.size ?? 0,
  }
}

let media: ReturnType<typeof stubMatchMedia>

beforeEach(() => {
  media = stubMatchMedia()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const MOBILE = "(max-width: 767px)"

describe("useMediaQuery", () => {
  // O ponto do `useSyncExternalStore`: o primeiro render já sai com o valor
  // certo. Com useState+useEffect haveria um quadro com o layout errado — no
  // kanban isso significaria montar o DndContext no celular.
  it("já devolve o valor correto no primeiro render", () => {
    media.set(MOBILE, true)

    const { result } = renderHook(() => useMediaQuery(MOBILE))

    expect(result.current).toBe(true)
  })

  it("devolve false quando a query não casa", () => {
    const { result } = renderHook(() => useMediaQuery(MOBILE))

    expect(result.current).toBe(false)
  })

  it("reage quando a janela muda de faixa", () => {
    const { result } = renderHook(() => useMediaQuery(MOBILE))
    expect(result.current).toBe(false)

    media.set(MOBILE, true)

    expect(result.current).toBe(true)
  })

  it("solta o listener no unmount", () => {
    const { unmount } = renderHook(() => useMediaQuery(MOBILE))
    expect(media.listenersDe(MOBILE)).toBe(1)

    unmount()

    expect(media.listenersDe(MOBILE)).toBe(0)
  })

  it("troca de assinatura quando a query muda", () => {
    const DESKTOP = "(min-width: 1024px)"
    const { rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: MOBILE },
    })

    rerender({ q: DESKTOP })

    expect(media.listenersDe(MOBILE)).toBe(0)
    expect(media.listenersDe(DESKTOP)).toBe(1)
  })
})

describe("useMountEffect", () => {
  it("roda o efeito uma única vez, mesmo com vários renders", () => {
    const efeito = vi.fn()
    const { rerender } = renderHook(() => useMountEffect(efeito))

    rerender()
    rerender()

    expect(efeito).toHaveBeenCalledTimes(1)
  })

  it("chama a limpeza no unmount", () => {
    const limpeza = vi.fn()
    const { unmount } = renderHook(() => useMountEffect(() => limpeza))

    expect(limpeza).not.toHaveBeenCalled()
    unmount()

    expect(limpeza).toHaveBeenCalledTimes(1)
  })

  it("aceita efeito sem limpeza", () => {
    const { unmount } = renderHook(() => useMountEffect(() => {}))

    expect(() => unmount()).not.toThrow()
  })
})
