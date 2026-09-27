import { Check } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { PASSWORD_RULES } from "./passwordRuleList"

const segment = tv({
  base: "h-1.5 flex-1 rounded-full transition-colors duration-300",
  variants: {
    state: {
      empty: "bg-raised",
      partial: "bg-warning",
      full: "bg-success",
    },
  },
})

const rule = tv({
  base: "flex items-center gap-2 text-[12.5px] transition-colors",
  variants: {
    passed: {
      true: "text-ink",
      false: "text-ink-3",
    },
  },
})

const dot = tv({
  base: "flex size-4 flex-none items-center justify-center rounded-full",
  variants: {
    passed: {
      true: "bg-success text-on-inverse",
      false: "inset-ring-[1.5px] inset-ring-border-strong",
    },
  },
})

interface PasswordRulesProps {
  value: string
}

type SegmentState = "empty" | "partial" | "full"

function segmentState(index: number, passedCount: number): SegmentState {
  if (index >= passedCount) return "empty"
  return passedCount === PASSWORD_RULES.length ? "full" : "partial"
}

/**
 * Medidor da senha (DS v2, Field): uma barra por regra e a lista que marca
 * cada uma conforme o usuário digita. Fica verde só quando todas passam.
 */
export function PasswordRules({ value }: PasswordRulesProps) {
  const { t } = useTranslation()
  const passed = PASSWORD_RULES.map((r) => r.test(value))
  const passedCount = passed.filter(Boolean).length

  return (
    <div className="rounded-[12px] bg-raised/60 p-3 hairline">
      <div className="mb-3 flex gap-1" aria-hidden="true">
        {PASSWORD_RULES.map((r, i) => (
          <span key={r.key} className={segment({ state: segmentState(i, passedCount) })} />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((r, i) => (
          <li key={r.key} className={rule({ passed: passed[i] })} data-passed={passed[i]}>
            <motion.span
              className={dot({ passed: passed[i] })}
              animate={{ scale: passed[i] ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.28 }}
            >
              {passed[i] && <Check size={10} strokeWidth={3.5} />}
            </motion.span>
            {t(`auth.passwordRules.${r.key}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}
