import { useRef } from "react"
import type { KeyboardEvent, RefObject } from "react"

import { useMountEffect } from "./useMountEffect"

interface OverlayLifecycle<T extends HTMLElement> {
  panelRef: RefObject<T | null>
  /** Vai no `onKeyDown` do painel: Esc fecha sem subir para outra camada. */
  handleKeyDown: (event: KeyboardEvent) => void
}

/**
 * Ciclo de vida de camada modal (modal, drawer, painel ⌘K).
 *
 * Deve rodar no componente que **só existe enquanto a camada está aberta**:
 * no mount trava a rolagem do body, lembra quem tinha o foco e leva o foco
 * para o painel; no unmount devolve os dois (acessibilidade §13). Esc é
 * tratado no próprio painel, e não no `document`, para que um drawer aberto
 * sobre outra camada feche só ele.
 */
export function useOverlayLifecycle<T extends HTMLElement>(onClose: () => void): OverlayLifecycle<T> {
  const panelRef = useRef<T>(null)

  useMountEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Só foca o painel se nada dentro dele já pediu foco (autoFocus num campo).
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  })

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape") return
    event.stopPropagation()
    onClose()
  }

  return { panelRef, handleKeyDown }
}
