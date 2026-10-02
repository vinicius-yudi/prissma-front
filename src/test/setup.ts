import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { MotionGlobalConfig } from "motion/react"
import { afterEach, vi } from "vitest"

/**
 * Setup global da suíte.
 *
 * Só o que TODO teste precisa. Mock de módulo da aplicação não entra aqui —
 * cada teste declara o que finge, senão um dia alguém depende de um mock
 * global sem saber que ele existe.
 */

// Animações do motion terminam na hora: saída de modal, troca de ícone e
// contagem não ficam presas esperando quadros que o jsdom não desenha.
MotionGlobalConfig.skipAnimations = true

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

// jsdom não implementa `scrollIntoView`, e chamá-lo estoura. O trilho de
// módulos da obra e o banner de estouro do orçamento rolam até o item ativo no
// mount — sem o stub, o componente quebra antes da primeira asserção.
Element.prototype.scrollIntoView ??= function scrollIntoView() {}

// jsdom não tem IntersectionObserver, e o motion o usa para `whileInView` e
// `onViewportEnter` (trena, contagem de KPI). O dublê reporta todo elemento
// observado como visível, que é o caso da tela de teste.
class IntersectionObserverStub {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverStub,
})
