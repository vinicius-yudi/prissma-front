import { motion } from "motion/react"
import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  count?: number
  /** Ponto `danger` ao lado — ex.: filtro "Atenção" com obra atrasada. */
  alert?: boolean
}

const track = tv({
  base: "inline-flex max-w-full overflow-x-auto rounded-[12px] bg-raised p-1 hairline scrollbar-none",
})

const item = tv({
  base: "relative inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-sm font-semibold transition-colors",
  variants: {
    size: {
      md: "h-[34px] px-3.5 text-[13px]",
      sm: "h-8 px-3 text-[12.5px]",
    },
    active: {
      true: "text-ink",
      false: "text-meta hover:text-ink-2",
    },
  },
})

const count = tv({
  base: "t-num relative text-[11px]",
  variants: {
    active: {
      true: "text-gold-hi",
      false: "text-meta",
    },
  },
})

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  /** Único na tela: nomeia o indicador compartilhado que desliza. */
  id: string
  size?: "md" | "sm"
  /** Nome acessível do grupo. */
  label?: string
  className?: string
}

/**
 * Filtro de uma escolha entre 2 e 5 opções do mesmo conteúdo (DS v2).
 *
 * O item ativo é uma pílula `surface` que desliza até a opção escolhida (mola
 * rígida, indicador compartilhado por `layoutId`). Quando cada opção é uma
 * página, use Tabs; mais de 5 opções, `select`.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  size = "md",
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={track({ className })}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={item({ size, active })}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-sm bg-surface shadow-soft"
                transition={SPRING}
              />
            )}
            <span className="relative">{option.label}</span>
            {option.count !== undefined && (
              <span className={count({ active })}>{option.count}</span>
            )}
            {option.alert && <span className="relative size-1.5 rounded-full bg-danger" />}
          </button>
        )
      })}
    </div>
  )
}
