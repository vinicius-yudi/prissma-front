import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const strip = tv({
  base: [
    "grid grid-cols-2 overflow-hidden rounded-lg bg-surface hairline lg:grid-cols-4",
    // Fios entre células: 2×2 no mobile, 4 em linha no desktop.
    "[&>*]:shadow-[inset_1px_0_0_var(--border),inset_0_1px_0_var(--border)]",
  ],
})

interface KpiStripProps {
  /** <KpiCard bare /> — quatro, em geral. */
  children: ReactNode
  className?: string
}

/** Faixa de KPIs: um card dividido em células por fios `border`. */
export function KpiStrip({ children, className }: KpiStripProps) {
  return <section className={strip({ className })}>{children}</section>
}
