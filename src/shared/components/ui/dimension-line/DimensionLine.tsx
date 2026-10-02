import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"

/**
 * Linha de cota (DS v2, Cota) — **uma por tela**, logo abaixo do título.
 *
 * Fio de 1px com traços verticais de 9px nas pontas e os valores em `t-data`
 * nas extremidades: o código da obra de um lado, uma medida real do outro
 * (área construída, prazo em dias). Nunca como divisor decorativo repetido —
 * por isso a guarda do <PageChrome>.
 */

const cota = tv({
  base: "t-data flex w-full max-w-[520px] items-center gap-2.5 text-[12px] font-medium text-meta",
})

interface DimensionLineProps {
  /** Extremidade esquerda — código da obra, data de início. */
  children: ReactNode
  /** Extremidade direita — a medida. Sem ela, só o fio com o rótulo. */
  measure?: ReactNode
  className?: string
}

export function DimensionLine({ children, measure, className }: DimensionLineProps) {
  useOncePerPage("dimensionLine")

  return (
    <p className={cota({ className })}>
      <span className="truncate">{children}</span>
      <span
        aria-hidden="true"
        className="relative h-[9px] min-w-8 flex-1 shadow-[inset_1px_0_0_currentColor,inset_-1px_0_0_currentColor] before:absolute before:inset-x-0 before:top-1 before:h-px before:bg-current"
      />
      {measure && <span className="flex-none">{measure}</span>}
    </p>
  )
}
