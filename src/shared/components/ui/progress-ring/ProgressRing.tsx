import { motion } from "motion/react"

import { SPRING_SLOW } from "@/shared/constants/motion"

interface ProgressRingProps {
  /** 0–100. */
  value: number
  size?: number
  stroke?: number
  /** `danger` quando a obra está atrasada. */
  tone?: "gold" | "danger" | "ok"
  label?: string
}

const STROKE: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  gold: "var(--gold)",
  danger: "var(--danger)",
  ok: "var(--success)",
}

/** Anel de progresso ao lado de cada obra em andamento na barra lateral. */
export function ProgressRing({ value, size = 20, stroke = 2.5, tone = "gold", label }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-none -rotate-90"
      role="img"
      aria-label={label}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={STROKE[tone]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
        transition={SPRING_SLOW}
      />
    </svg>
  )
}
