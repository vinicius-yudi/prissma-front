import { tv } from "tailwind-variants"

import { Num } from "../num/Num"

/**
 * KPI — label + valor em mono + pill de variação semântica.
 *
 * O valor sempre passa pelo <Num>; a variação carrega o sinal (▲/▼) além da
 * cor, porque status nunca é comunicado só por cor (Style Guide v2 §6).
 */

export type DeltaTone = "ok" | "warn" | "danger" | "neutral"

const deltaPill = tv({
  base: "inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] t-num text-[10.5px] font-semibold",
  variants: {
    tone: {
      ok: "bg-success-soft text-success",
      warn: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      neutral: "bg-raised text-gold-hi",
    },
  },
})

const card = tv({
  base: "rounded-2xl border border-border bg-surface p-5",
})

interface KpiCardProps {
  label: string
  value: string
  delta?: {
    /** Já formatado com o sinal, ex.: "▲ 18%". */
    text: string
    tone?: DeltaTone
  }
  /** Nota de rodapé, sparkline ou qualquer conteúdo auxiliar. */
  children?: React.ReactNode
  className?: string
}

export function KpiCard({ label, value, delta, children, className }: KpiCardProps) {
  return (
    <div className={card({ className })}>
      <div className="text-xs font-medium text-ink-2">{label}</div>

      <div className="mt-[7px] flex items-baseline gap-[9px]">
        <Num className="text-2xl font-bold text-ink">{value}</Num>
        {delta && <span className={deltaPill({ tone: delta.tone ?? "neutral" })}>{delta.text}</span>}
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
