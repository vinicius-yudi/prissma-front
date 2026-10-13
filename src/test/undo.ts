import { act } from "@testing-library/react"
import { vi } from "vitest"

import { UNDO_WINDOW_MS } from "@/shared/hooks/useUndoableDelete"

/**
 * Exclusão com Desfazer só chega ao servidor quando a janela fecha. O teste
 * liga relógio falso antes de excluir (`shouldAdvanceTime` mantém o
 * userEvent e o `waitFor` andando) e avança a janela aqui.
 */
export function relogioDoDesfazer() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
}

export async function passarJanelaDoDesfazer() {
  await act(async () => {
    vi.advanceTimersByTime(UNDO_WINDOW_MS)
  })
}
