import { Paperclip, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { SPRING } from "@/shared/constants/motion"

import { DIARY_ICON, DIARY_TYPE } from "../../constants/diario"
import type { DiarioEntry } from "../../types/diario"

const bubble = tv({
  base: "relative z-10 flex size-10 flex-none items-center justify-center rounded-full ring-4 ring-bg",
  variants: {
    type: {
      IMPEDIMENT: "bg-danger text-on-inverse",
      DELIVERY: "bg-gold-soft text-gold-hi",
      WORKFORCE: "bg-surface text-ink-2 hairline",
      OCCURRENCE: "bg-surface text-ink-2 hairline",
    },
  },
})

const card = tv({
  base: "block w-full min-w-0 cursor-pointer rounded-[14px] bg-surface p-4 text-left hairline transition-shadow hover:shadow-soft",
  variants: { impediment: { true: "inset-ring-1 inset-ring-danger/40" } },
})

const typeLabel = tv({
  base: "font-[620]",
  variants: { impediment: { true: "text-danger", false: "text-ink-2" } },
})

interface DiaryEntryCardProps {
  entry: DiarioEntry
  canDelete: boolean
  onOpen: (entry: DiarioEntry) => void
  onDelete: (entry: DiarioEntry) => void
}

/** Um registro na linha do tempo: ícone do tipo, autor, hora e o texto. */
export function DiaryEntryCard({ entry, canDelete, onOpen, onDelete }: DiaryEntryCardProps) {
  const { t, i18n } = useTranslation()
  const Icon = DIARY_ICON[entry.entryType]
  const impediment = entry.entryType === DIARY_TYPE.IMPEDIMENT
  const time = new Date(entry.entryDate).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })

  return (
    <motion.li layout initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING} className="relative flex gap-3.5">
      <span className={bubble({ type: entry.entryType })} aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="group relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(entry)}
          aria-label={t("obra.diario.details.open", { type: t(`obra.diario.types.${entry.entryType}`) })}
          className={card({ impediment })}
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-8 text-[12.5px] text-meta">
            <span className={typeLabel({ impediment })}>{t(`obra.diario.types.${entry.entryType}`)}</span>·
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={entry.responsibleName} size={18} />
              {entry.responsibleName}
            </span>
            ·<span className="t-num">{time}</span>
            {entry.attachmentId && (
              <span className="inline-flex items-center gap-1 text-gold-hi">
                <Paperclip size={12} />
                {t("obra.diario.hasAttachment")}
              </span>
            )}
          </span>
          <span className="mt-1.5 line-clamp-4 block text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink">{entry.description}</span>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(entry)}
            aria-label={t("obra.diario.actions.delete")}
            className="absolute top-2.5 right-2.5 flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-ink-3 transition-opacity hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.li>
  )
}
