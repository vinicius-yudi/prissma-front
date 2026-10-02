import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { ReactNode } from "react"

interface AttentionCardProps {
  /** Faixa `danger-soft` do topo: "2 pontos precisam de decisão". */
  heading: string
  /** Quantos alertas há; zero mostra a linha de tudo em dia. */
  count: number
  /** Texto da linha sem alertas: "Tudo dentro do prazo e do orçamento." */
  emptyText: string
  /** Linhas <AlertRow>, já ordenadas por gravidade. */
  children: ReactNode
}

/**
 * Card de atenção (DS v2): faixa de decisão em `danger-soft` seguida das
 * linhas de alerta, com contorno `danger` a 35%. Sem alertas, uma linha com
 * check `success`.
 */
export function AttentionCard({ heading, count, emptyText, children }: AttentionCardProps) {
  if (count === 0) {
    return (
      <section className="flex items-center gap-3 rounded-lg bg-surface px-5 py-4 hairline">
        <CheckCircle2 size={18} className="flex-none text-success" />
        <p className="text-[14px] text-ink-2">{emptyText}</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg bg-surface inset-ring inset-ring-danger/35">
      <header className="flex items-center gap-2.5 bg-danger-soft px-5 py-3 text-[14px] font-[640] text-danger">
        <AlertTriangle size={16} />
        {heading}
      </header>
      <div>{children}</div>
    </section>
  )
}
