import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

import { Num } from "../num/Num"

/**
 * Célula de KPI (DS v2, Card → faixa de KPIs).
 *
 * Rótulo 13px, valor `t-kpi` e uma linha de contexto que diz o que o número
 * significa ("precisam de decisão"). Só o indicador de problema fica
 * `danger`. A variação carrega o sinal (▲/▼) além da cor — status nunca só
 * por cor.
 *
 * Sozinha é um card; dentro de <KpiStrip> vira célula de uma faixa dividida
 * por fios (`bare`).
 */

export type DeltaTone = "ok" | "warn" | "danger" | "neutral"

const deltaPill = tv({
  base: "t-num inline-flex h-6 items-center gap-1 rounded-pill px-2 text-[11.5px] font-semibold",
  variants: {
    tone: {
      ok: "bg-success-soft text-success",
      warn: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      neutral: "bg-raised text-ink-2",
    },
  },
})

const card = tv({
  base: "p-5",
  variants: {
    bare: {
      true: "",
      false: "rounded-lg bg-surface hairline",
    },
  },
})

const valueText = tv({
  base: "t-kpi text-[30px] text-ink",
  variants: {
    danger: { true: "text-danger" },
  },
})

interface KpiCardProps {
  label: string
  /** Texto já formatado, ou um <Ticker> para contar ao entrar na tela. */
  value: ReactNode
  /** Só o indicador de problema (atrasos, estouro). */
  danger?: boolean
  delta?: {
    /** Já formatado com o sinal, ex.: "▲ 18%". */
    text: string
    tone?: DeltaTone
  }
  /** Linha de contexto, trena ou qualquer conteúdo auxiliar. */
  children?: ReactNode
  /** Dentro de <KpiStrip>: sem superfície própria. */
  bare?: boolean
  className?: string
}

export function KpiCard({ label, value, danger, delta, children, bare = false, className }: KpiCardProps) {
  return (
    <div className={card({ bare, className })}>
      <div className="text-[13px] text-meta">{label}</div>

      <div className="mt-1.5 flex items-baseline gap-2">
        <Num className={valueText({ danger })}>{value}</Num>
        {delta && <span className={deltaPill({ tone: delta.tone ?? "neutral" })}>{delta.text}</span>}
      </div>

      {children && <div className="mt-2 text-[12.5px] text-ink-2">{children}</div>}
    </div>
  )
}
