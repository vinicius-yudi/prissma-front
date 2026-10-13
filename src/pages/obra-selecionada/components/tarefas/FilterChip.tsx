import { Check } from "lucide-react"
import { motion } from "motion/react"
import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const chip = tv({
  base: "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-[600] transition-colors",
  variants: {
    on: { true: "", false: "bg-surface text-ink-2 hairline hover:text-ink" },
    tone: { gold: "", danger: "" },
  },
  compoundVariants: [
    { on: true, tone: "gold", className: "bg-gold text-on-gold" },
    { on: true, tone: "danger", className: "bg-danger text-on-inverse" },
  ],
})

interface FilterChipProps {
  on: boolean
  onClick: () => void
  tone?: "gold" | "danger"
  children: ReactNode
}

/** Filtro liga/desliga em pill; ligado ganha ✓ e a cor cheia. */
export function FilterChip({ on, onClick, tone = "gold", children }: FilterChipProps) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onClick} aria-pressed={on} className={chip({ on, tone })}>
      {on && <Check size={13} strokeWidth={3} />}
      {children}
    </motion.button>
  )
}
