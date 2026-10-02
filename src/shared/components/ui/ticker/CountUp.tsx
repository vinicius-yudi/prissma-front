import { motion, useSpring, useTransform } from "motion/react"

import type { TickerProps } from "./Ticker"
import { defaultFormat } from "./tickerFormat"

/** Contagem com mola a partir de zero, disparada ao entrar na viewport. */
export function CountUp({ value, format = defaultFormat, className }: TickerProps) {
  const spring = useSpring(0, { stiffness: 90, damping: 22 })
  const text = useTransform(spring, format)

  return (
    <motion.span
      className={className}
      aria-label={format(value)}
      viewport={{ once: true }}
      onViewportEnter={() => spring.set(value)}
    >
      <motion.span aria-hidden="true">{text}</motion.span>
    </motion.span>
  )
}
