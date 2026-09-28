import { useCallback, useSyncExternalStore } from "react"

/**
 * Casa uma media query em JavaScript.
 *
 * Existe para os casos em que `hidden md:block` não basta: esconder por CSS
 * ainda **monta** o componente, e o kanban de tarefas não pode montar um
 * `DndContext` no celular só para ficar invisível. Onde a decisão for apenas
 * visual, continue usando as classes do Tailwind — são mais baratas e não
 * dependem de hidratação.
 *
 * `useSyncExternalStore` em vez de `useState` + `useEffect`: o valor do
 * primeiro render já é o correto, então não há um quadro com o layout errado.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  // No servidor não há viewport; assumir "desktop" mantém o SSR estável caso
  // ele entre no projeto, e no cliente o primeiro snapshot já corrige.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
