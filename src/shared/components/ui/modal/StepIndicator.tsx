import { Check } from "lucide-react"
import { motion } from "motion/react"
import { Fragment } from "react"
import { tv } from "tailwind-variants"

import { SPRING, SPRING_SOFT } from "@/shared/constants/motion"

const circle = tv({
  base: "t-num flex size-7 flex-none items-center justify-center rounded-full text-[12.5px] font-bold transition-colors",
  variants: {
    state: {
      completed: "bg-gold text-on-gold",
      active: "bg-gold-soft text-gold-hi inset-ring-2 inset-ring-gold",
      inactive: "bg-raised text-ink-3",
    },
  },
})

const label = tv({
  base: "text-[13px] font-semibold transition-colors",
  variants: {
    active: {
      true: "text-ink",
      false: "text-ink-3",
    },
  },
})

type StepState = "completed" | "active" | "inactive"

function stepState(index: number, current: number): StepState {
  if (index + 1 < current) return "completed"
  if (index + 1 === current) return "active"
  return "inactive"
}

interface StepIndicatorProps {
  steps: string[]
  current: number // 1-based
}

/**
 * Passos de um modal em etapas (nova obra). O número vira ✓ ao concluir e o
 * fio ouro corre com mola até o próximo passo.
 */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-3 px-6 pt-1 pb-5">
      {steps.map((stepLabel, i) => {
        const state = stepState(i, current)

        return (
          <Fragment key={stepLabel}>
            <li className="flex flex-none items-center gap-2" aria-current={state === "active" ? "step" : undefined}>
              <span className={circle({ state })}>
                {state === "completed" ? (
                  <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={SPRING}>
                    <Check size={14} strokeWidth={3} />
                  </motion.span>
                ) : (
                  i + 1
                )}
              </span>
              <span className={label({ active: state !== "inactive" })}>{stepLabel}</span>
            </li>

            {i < steps.length - 1 && (
              <li aria-hidden="true" className="relative h-px flex-1 bg-border">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gold"
                  initial={false}
                  animate={{ width: state === "completed" ? "100%" : "0%" }}
                  transition={SPRING_SOFT}
                />
              </li>
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}
