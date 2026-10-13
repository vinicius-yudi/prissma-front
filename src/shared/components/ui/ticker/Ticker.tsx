import { useReducedMotion } from "motion/react"

import { CountUp } from "./CountUp"
import { defaultFormat } from "./tickerFormat"

export interface TickerProps {
  value: number
  /** Formata o número em cada quadro — moeda, percentual, contagem. */
  format?: (value: number) => string
  className?: string
}

/**
 * Número que conta de zero até o valor quando entra na tela (DS v2: "números
 * contam"). O valor final vai no `aria-label`, para leitor de tela não ouvir a
 * contagem. Com movimento reduzido, mostra o valor direto.
 *
 * A `key` reinicia a contagem quando o valor muda depois de um refetch — a
 * mola de uma contagem antiga não sabe do valor novo.
 */
export function Ticker({ value, format = defaultFormat, className }: TickerProps) {
  const reduced = useReducedMotion()

  if (reduced) return <span className={className}>{format(value)}</span>
  return <CountUp key={value} value={value} format={format} className={className} />
}
