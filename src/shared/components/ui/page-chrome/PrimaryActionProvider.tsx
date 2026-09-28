import { useMemo, useState } from "react"

import { PrimaryActionContext, type PrimaryAction } from "./primaryAction"

/** Guarda a ação primária registrada pela tela aberta. Ver `primaryAction.ts`. */
export function PrimaryActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<PrimaryAction | null>(null)
  const value = useMemo(() => ({ action, setAction }), [action])

  return <PrimaryActionContext.Provider value={value}>{children}</PrimaryActionContext.Provider>
}
