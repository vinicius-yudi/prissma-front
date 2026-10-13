import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"

import { DIARY_ICON, DIARY_TYPE, DIARY_TYPES } from "../../constants/diario"
import type { DiarioEntryType } from "../../types/diario"

const option = tv({
  base: "relative flex h-11 cursor-pointer items-center gap-2 rounded-[11px] px-3 text-left text-[13px] font-[600] disabled:cursor-default",
  variants: {
    selected: { true: "", false: "text-ink-2 hairline hover:text-ink" },
    danger: { true: "", false: "" },
  },
  compoundVariants: [
    { selected: true, danger: true, className: "text-danger" },
    { selected: true, danger: false, className: "text-gold-hi" },
  ],
})

const highlight = tv({
  base: "absolute inset-0 rounded-[11px] inset-ring-[1.5px]",
  variants: { danger: { true: "bg-danger-soft inset-ring-danger", false: "bg-gold-soft inset-ring-gold" } },
})

interface DiaryTypePickerProps {
  value: DiarioEntryType
  disabled: boolean
  onChange: (type: DiarioEntryType) => void
}

/** Tipo do registro em 2×2; impedimento acende em perigo. */
export function DiaryTypePicker({ value, disabled, onChange }: DiaryTypePickerProps) {
  const { t } = useTranslation()

  return (
    <div role="radiogroup" aria-label={t("obra.diario.form.type")} className="grid grid-cols-2 gap-1.5">
      {DIARY_TYPES.map((type) => {
        const Icon = DIARY_ICON[type]
        const selected = value === type
        const danger = type === DIARY_TYPE.IMPEDIMENT
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(type)}
            className={option({ selected, danger })}
          >
            {selected && <motion.span layoutId="diary-type" className={highlight({ danger })} transition={SPRING} />}
            <Icon size={15} className="relative flex-none" />
            <span className="relative truncate">{t(`obra.diario.types.${type}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
