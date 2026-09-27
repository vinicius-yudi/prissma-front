import { Plus, RefreshCw } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import type { Stage } from "../../services/stages.service"
import { Gantt } from "../gantt/Gantt"

const LOADING_ROWS = ["a", "b", "c", "d"]

interface StagesContentProps {
  isLoading: boolean
  isError: boolean
  stages: Stage[]
  /** Gantt no lugar da lista. */
  showGantt: boolean
  summaries: StageSummary[]
  canMutate: boolean
  onRetry: () => void
  onCreate: () => void
  onSelectInGantt: (stage: StageSummary) => void
  /** A lista ordenável, montada por quem tem os handlers. */
  list: ReactNode
}

/** Corpo de Etapas: carregando, erro, vazio, cronograma ou lista — um por vez. */
export function StagesContent(props: StagesContentProps) {
  const { t } = useTranslation()

  if (props.isLoading) {
    return (
      <div className="space-y-2.5" aria-busy="true">
        {LOADING_ROWS.map((key) => (
          <div key={key} className="h-[76px] animate-pulse rounded-lg bg-surface hairline" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <EmptyState
        title={t("obra.acompError")}
        action={
          <Button variant="outline" fullWidth={false} onClick={props.onRetry}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        }
      />
    )
  }

  if (props.stages.length === 0) {
    return (
      <EmptyState
        title={t("obra.etapas.emptyTitle")}
        body={t("obra.etapas.emptyHint")}
        action={
          props.canMutate && (
            <Button fullWidth={false} onClick={props.onCreate}>
              <Plus size={15} />
              {t("obra.etapas.emptyCta")}
            </Button>
          )
        }
      />
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={props.showGantt ? "gantt" : "list"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {props.showGantt ? (
          <section className="rounded-lg bg-surface p-5 hairline sm:p-6">
            <Gantt stages={props.summaries} onSelect={props.onSelectInGantt} />
          </section>
        ) : (
          <>
            {props.list}
            {props.canMutate && (
              <button
                type="button"
                onClick={props.onCreate}
                className="mt-2.5 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong text-[14px] font-semibold text-ink-3 transition-colors hover:border-gold hover:text-gold-hi"
              >
                <Plus size={16} />
                {t("obra.etapas.addAtEnd")}
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
