import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"

const iconBox = tv({
  base: "flex size-9 flex-none items-center justify-center rounded-[10px]",
  variants: {
    tone: {
      danger: "bg-danger-soft text-danger",
      warning: "bg-warning-soft text-warning",
    },
  },
})

interface AlertRowProps {
  /** `danger`: atraso, bloqueio, estouro. `warning`: > 85% ou prazo em 2 dias. */
  tone: "danger" | "warning"
  /** Ícone que repete a semântica (triângulo = atraso, carteira = orçamento). */
  icon: ReactNode
  title: string
  /** Sempre quantifica: "2 dias de atraso", "R$ 4.040 além de R$ 52.000". */
  meta: string
  /** A aba onde o problema se resolve. */
  to: string
}

/**
 * Linha de "Precisa da sua atenção" (DS v2, Alerta): ícone em quadrado de
 * 36px, título, metadado com o tamanho do problema e seta para onde se
 * resolve. O alerta sempre leva ícone e palavra — `warning` e ouro têm matizes
 * próximos.
 */
export function AlertRow({ tone, icon, title, meta, to }: AlertRowProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-raised/60 [&+&]:shadow-[inset_0_1px_0_var(--border)]"
    >
      <span className={iconBox({ tone })}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-[580] text-ink">{title}</span>
        <span className="t-num mt-px block truncate text-[12.5px] text-meta">{meta}</span>
      </span>
      <ChevronRight size={16} className="flex-none text-meta transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
