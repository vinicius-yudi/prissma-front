import { Check } from "lucide-react"
import { Fragment } from "react"
import { tv } from "tailwind-variants"

const connector = tv({
  base: "flex-1 h-0.5 mx-3 mb-5 transition-all",
  variants: {
    completed: {
      true: "bg-primary",
      false: "bg-outline-variant",
    },
  },
})

const circle = tv({
  base: "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all flex-none",
  variants: {
    state: {
      completed: "bg-primary border-primary text-on-primary",
      active: "bg-primary border-primary text-on-primary",
      inactive: "bg-transparent border-outline-variant text-on-surface-variant",
    },
  },
})

const label = tv({
  base: "text-xs font-semibold uppercase tracking-widest transition-colors",
  variants: {
    active: {
      true: "text-primary",
      false: "text-on-surface-variant",
    },
  },
})

interface StepIndicatorProps {
  steps: string[]
  current: number // 1-based
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="px-6 pb-5 pt-1">
      <div className="flex items-center">
        {steps.map((stepLabel, i) => {
          const isCompleted = i + 1 < current
          const isActive = i + 1 === current

          return (
            <Fragment key={stepLabel}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={circle({
                    state: isCompleted ? "completed" : isActive ? "active" : "inactive",
                  })}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <span>{i + 1}</span>}
                </div>
                <span className={label({ active: isCompleted || isActive })}>{stepLabel}</span>
              </div>

              {i < steps.length - 1 && (
                <div className={connector({ completed: isCompleted })} />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
