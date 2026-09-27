import { motion } from "motion/react"
import type { ReactNode } from "react"

export interface DonutSegment {
  key: string
  value: number
  /** Cor como `var(--token)` — o SVG não lê classe do Tailwind no stroke. */
  color: string
}

interface DonutProps {
  segments: DonutSegment[]
  size?: number
  stroke?: number
  /** Conteúdo no centro (percentual usado, total). */
  children?: ReactNode
  label?: string
}

/**
 * Anel segmentado (orçamento por categoria). Cada fatia entra com mola lenta,
 * em cascata; o trilho é `raised`.
 */
export function Donut({ segments, size = 180, stroke = 22, children, label }: DonutProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const center = size / 2

  const arcs = segments.reduce<{ segment: DonutSegment; length: number; offset: number }[]>(
    (acc, segment) => {
      const offset = acc.reduce((sum, a) => sum + a.length, 0)
      acc.push({ segment, length: (segment.value / total) * circumference, offset })
      return acc
    },
    [],
  )

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
        {arcs.map(({ segment, length, offset }, i) => (
          <motion.circle
            key={segment.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={stroke}
            // 2px de folga entre fatias, para as cores não se fundirem.
            strokeDasharray={`${Math.max(0, length - 2)} ${circumference}`}
            initial={{ strokeDashoffset: -offset + length, opacity: 0 }}
            animate={{ strokeDashoffset: -offset, opacity: 1 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 60, damping: 16 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
