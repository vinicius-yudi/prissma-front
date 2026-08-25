import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"

/**
 * Linha de cota — assinatura da marca.
 *
 * Tirada do desenho técnico: traços verticais de 9px nas pontas, linha de 1px
 * e o valor em mono sobre ela. Vai como subtítulo do H1, **uma por tela**.
 * Nunca como decoração repetida (Style Guide v2 §4).
 */

const line = tv({
  base: "flex items-center gap-[9px]",
})

interface DimensionLineProps {
  children: React.ReactNode
  className?: string
}

export function DimensionLine({ children, className }: DimensionLineProps) {
  useOncePerPage("dimensionLine")

  return (
    <div className={line({ className })}>
      <span className="h-[9px] w-px flex-none bg-outline" />
      <span className="h-px w-[22px] flex-none bg-outline" />
      <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.05em] text-on-surface-faint">
        {children}
      </span>
      <span className="h-px max-w-[110px] flex-1 bg-outline" />
      <span className="h-[9px] w-px flex-none bg-outline" />
    </div>
  )
}
