import { NotebookPen, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import type { DiarioEntry } from "../../types/diario"
import { groupByDay } from "../../utils/diarioGroups"
import { DiaryDayGroup } from "./DiaryDayGroup"

const LOADING_ROWS = ["a", "b", "c"]

interface DiaryTimelineProps {
  entries: DiarioEntry[]
  isLoading: boolean
  isError: boolean
  /** Algum filtro de tipo está ligado — o vazio oferece limpar. */
  filtered: boolean
  canDelete: boolean
  onRetry: () => void
  onClearFilter: () => void
  onOpen: (entry: DiarioEntry) => void
  onDelete: (entry: DiarioEntry) => void
}

/** Linha do tempo: carregando, erro, vazio ou os dias — um por vez. */
export function DiaryTimeline(props: DiaryTimelineProps) {
  const { t } = useTranslation()

  if (props.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {LOADING_ROWS.map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-[14px] bg-surface hairline" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <EmptyState
        title={t("obra.diario.error")}
        action={
          <Button variant="outline" fullWidth={false} onClick={props.onRetry}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        }
      />
    )
  }

  if (props.entries.length === 0) {
    return (
      <EmptyState
        icon={<NotebookPen size={26} />}
        title={props.filtered ? t("obra.diario.emptyFiltered") : t("obra.diario.emptyTitle")}
        body={props.filtered ? undefined : t("obra.diario.emptyBody")}
        action={
          props.filtered && (
            <Button variant="outline" fullWidth={false} onClick={props.onClearFilter}>
              {t("obra.diario.showAll")}
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      {groupByDay(props.entries).map((day) => (
        <DiaryDayGroup key={day.key} day={day} canDelete={props.canDelete} onOpen={props.onOpen} onDelete={props.onDelete} />
      ))}
    </div>
  )
}
