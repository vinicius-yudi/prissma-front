import type { ReactNode } from "react"

interface PageHeaderProps {
  title: ReactNode
  /** Linha acima do título: a data no Início. */
  eyebrow?: ReactNode
  /** Frase com sujeito e número: "3 em andamento, 1 em planejamento". */
  subtitle?: ReactNode
  /** A linha de cota da tela, quando houver — uma por tela, sob o título. */
  dimension?: ReactNode
  actions?: ReactNode
}

/**
 * Cabeçalho de página (DS v2): título `t-title` (40px no desktop), subtítulo
 * em `ink-2` e as ações à direita. É o topo de Início, Obras, Pessoas e Perfil.
 */
export function PageHeader({ title, eyebrow, subtitle, dimension, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[14px] text-meta first-letter:uppercase">{eyebrow}</p>}
        <h1 className="t-title text-[clamp(28px,3.4vw,40px)] text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-[60ch] text-[15px] text-ink-2">{subtitle}</p>}
        {dimension && <div className="mt-3">{dimension}</div>}
      </div>
      {actions && <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
