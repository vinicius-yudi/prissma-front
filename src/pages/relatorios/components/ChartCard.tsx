import type { ReactNode } from "react"

import { SectionCard } from "@/pages/obra-selecionada/components/visao-geral/SectionCard"

interface ChartCardProps {
  title: string
  meta?: ReactNode
  /** Sem dado no recorte: o card fica, com a frase no lugar do gráfico. */
  emptyText: string | null
  children: ReactNode
}

/** Bloco do dashboard: card com título e um vazio explícito por gráfico. */
export function ChartCard({ title, meta, emptyText, children }: ChartCardProps) {
  return (
    <SectionCard title={title} meta={meta}>
      {emptyText === null ? children : <p className="py-12 text-center text-[14px] text-meta">{emptyText}</p>}
    </SectionCard>
  )
}
