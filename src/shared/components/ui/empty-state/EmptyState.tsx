import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const empty = tv({
  base: "blueprint flex w-full flex-col items-center justify-center rounded-lg px-6 py-14 text-center hairline",
})

interface EmptyStateProps {
  /** Diz o que não há. */
  title: string
  /** Diz o que fazer. */
  body?: string
  icon?: ReactNode
  /**
   * No máximo uma ação. Com filtro ativo, limpar o filtro; sem dado nenhum,
   * criar o primeiro item.
   */
  action?: ReactNode
  /** Quando o vazio é a página inteira (404, acesso negado), o título é o `h1`. */
  as?: "p" | "h1" | "h2"
  className?: string
}

/**
 * Vazio sobre papel quadriculado: o espaço que ainda não foi desenhado
 * (DS v2, EmptyState). Sem ilustração nem emoji.
 */
export function EmptyState({ title, body, icon, action, as: Title = "p", className }: EmptyStateProps) {
  return (
    <div className={empty({ className })}>
      {icon && <div className="mb-4 text-gold-hi">{icon}</div>}
      <Title className="t-section text-[17px] text-ink">{title}</Title>
      {body && <p className="mt-1.5 max-w-[42ch] text-[14px] text-ink-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
