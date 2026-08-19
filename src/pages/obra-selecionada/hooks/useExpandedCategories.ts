import { useCallback, useState } from "react"

export function useExpandedCategories() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isExpanded = useCallback((id: number) => expanded.has(id), [expanded])

  return { toggle, isExpanded }
}
