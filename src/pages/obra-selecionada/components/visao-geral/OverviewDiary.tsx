import { Ban, HardHat, MessageSquareText, Truck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { formatDate } from "@/shared/utils/formatters"

import { useDiario } from "../../hooks/useDiario"
import type { DiarioEntryType } from "../../types/diario"
import { SectionCard } from "./SectionCard"

const ICON: Record<DiarioEntryType, LucideIcon> = {
  OCCURRENCE: MessageSquareText,
  DELIVERY: Truck,
  WORKFORCE: HardHat,
  IMPEDIMENT: Ban,
}

const node = tv({
  base: "relative flex size-7 flex-none items-center justify-center rounded-full ring-4 ring-surface",
  variants: {
    impediment: {
      true: "bg-danger-soft text-danger",
      false: "bg-raised text-ink-2",
    },
  },
})

/** Impedimento é o único tipo em `danger` — é problema na obra. */
const IS_IMPEDIMENT: Record<DiarioEntryType, boolean> = {
  OCCURRENCE: false,
  DELIVERY: false,
  WORKFORCE: false,
  IMPEDIMENT: true,
}

const RECENT = 3

/** Os três últimos registros do diário, em linha do tempo. */
export function OverviewDiary({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const { entries } = useDiario(projectId)
  const recent = entries.slice(0, RECENT)

  return (
    <SectionCard title={t("obra.diario.title")} action={{ to: `/obras/${projectId}/diario`, label: t("obra.visaoGeral.openDiary") }}>
      {recent.length === 0 ? (
        <p className="text-[14px] text-meta">{t("obra.visaoGeral.noDiary")}</p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border">
          {recent.map((entry) => {
            const Icon = ICON[entry.entryType]
            return (
              <li key={entry.id} className="relative flex gap-3">
                <span className={node({ impediment: IS_IMPEDIMENT[entry.entryType] })}>
                  <Icon size={13} />
                </span>
                <div className="min-w-0">
                  <p className="t-num text-[12px] text-meta">
                    {t(`obra.diario.types.${entry.entryType}`)} · {formatDate(entry.entryDate)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-ink">{entry.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}
