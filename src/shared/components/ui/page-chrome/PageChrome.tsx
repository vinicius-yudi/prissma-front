import { createContext, useCallback, useContext, useEffect, useRef } from "react"

/**
 * Guarda das regras "no máximo um por tela" do design.
 *
 * O Style Guide v2 descreve em prosa que a linha de cota aparece uma vez por
 * tela (sob o H1), que o card de contraste é reservado ao conteúdo
 * protagonista e que só existe um botão primário por vista. Sem uma guarda
 * essas regras se dissolvem conforme as telas crescem — e é justamente a
 * multiplicação de destaques que devolve cara de template.
 *
 * Só reclama em desenvolvimento. Fora de um provider vira no-op, para que os
 * componentes funcionem nas telas públicas (login, cadastro) sem shell.
 */

export type PageSlot = "dimensionLine" | "contrastCard" | "primaryButton"

const SLOT_LABEL: Record<PageSlot, string> = {
  dimensionLine: "A linha de cota (<DimensionLine>)",
  contrastCard: "O card de contraste (<ContrastCard>)",
  primaryButton: 'O botão primário (<Button variant="primary">)',
}

interface PageChromeValue {
  claim: (slot: PageSlot) => () => void
}

const PageChromeContext = createContext<PageChromeValue | null>(null)

interface PageChromeProviderProps {
  children: React.ReactNode
}

export function PageChromeProvider({ children }: PageChromeProviderProps) {
  const counts = useRef<Partial<Record<PageSlot, number>>>({})

  const claim = useCallback((slot: PageSlot) => {
    const next = (counts.current[slot] ?? 0) + 1
    counts.current[slot] = next

    if (import.meta.env.DEV && next > 1) {
      console.error(
        `[prissma] ${SLOT_LABEL[slot]} aparece ${next}x nesta tela. ` +
          "O design pede no máximo um — ver Style Guide v2 §4 e §5.",
      )
    }

    return () => {
      counts.current[slot] = Math.max(0, (counts.current[slot] ?? 1) - 1)
    }
  }, [])

  return <PageChromeContext.Provider value={{ claim }}>{children}</PageChromeContext.Provider>
}

/**
 * Registra a montagem de um slot único por tela. A contagem sobe no efeito e
 * desce na limpeza, então o duplo-render do StrictMode não gera falso
 * positivo.
 */
export function useOncePerPage(slot: PageSlot, enabled = true) {
  const ctx = useContext(PageChromeContext)

  useEffect(() => {
    if (!ctx || !enabled) return
    return ctx.claim(slot)
  }, [ctx, slot, enabled])
}
