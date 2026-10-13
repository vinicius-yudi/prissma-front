import type { ReactNode } from "react"
import { Link } from "react-router-dom"

interface SectionCardProps {
  title: string
  /** Contagem ou resumo ao lado do título, em `t-data`. */
  meta?: ReactNode
  /** Link "quieto" para o módulo cheio. */
  action?: { to: string; label: string }
  children: ReactNode
}

/** Bloco da Visão geral: card com título `t-section` e atalho para o módulo. */
export function SectionCard({ title, meta, action, children }: SectionCardProps) {
  return (
    <section className="rounded-lg bg-surface p-5 hairline sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="t-section text-ink">{title}</h2>
          {meta !== undefined && <span className="t-data text-meta">{meta}</span>}
        </div>
        {action && (
          <Link to={action.to} className="flex-none text-[13px] font-[620] whitespace-nowrap text-gold-hi hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
