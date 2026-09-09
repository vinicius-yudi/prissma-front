import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

/**
 * Setup global da suíte.
 *
 * Só o que TODO teste precisa. Mock de módulo da aplicação não entra aqui —
 * cada teste declara o que finge, senão um dia alguém depende de um mock
 * global sem saber que ele existe.
 */

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom não implementa matchMedia, e o ThemeProvider consulta
// `prefers-color-scheme` no primeiro render. Sem isto todo teste que monta um
// componente com tema estoura antes da primeira asserção.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

// Idem para ResizeObserver, que o Recharts e alguns componentes de layout
// instanciam no mount.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
