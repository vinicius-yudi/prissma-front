import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, GripVertical, Pencil, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { EtapaStatus } from "@/pages/projetos/types"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { formatDate } from "@/shared/utils/formatters"

import type { Stage } from "../../services/stages.service"
import { StageStatusSelect } from "./StageStatusSelect"

const card = tv({
  base: "group relative overflow-hidden rounded-lg bg-surface hairline transition-shadow",
  variants: {
    late: { true: "inset-ring-danger/45" },
    dragging: { true: "z-30 shadow-lift" },
  },
})

/** Trilho de 3px à esquerda com a cor do estado. */
const rail = tv({
  base: "absolute inset-y-0 left-0 w-[3px]",
  variants: {
    state: {
      DONE: "bg-success",
      IN_PROGRESS: "bg-gold",
      BLOCKED: "bg-warning",
      PLANNED: "bg-border-strong",
      late: "bg-danger",
    },
  },
})

const index = tv({
  base: "t-kpi text-[30px] leading-none",
  variants: { done: { true: "text-meta", false: "text-ink" } },
})

const chevron = tv({
  base: "flex-none text-meta transition-transform",
  variants: { open: { true: "rotate-180" } },
})

const iconAction = tv({
  base: "flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-meta disabled:pointer-events-none disabled:opacity-30",
  variants: {
    danger: {
      true: "hover:bg-danger-soft hover:text-danger",
      false: "hover:bg-raised hover:text-ink",
    },
  },
  defaultVariants: { danger: false },
})

type TapeTone = "gold" | "ok" | "danger"

function tapeTone(late: boolean, done: boolean): TapeTone {
  if (late) return "danger"
  if (done) return "ok"
  return "gold"
}

interface StageRowProps {
  stage: Stage
  /** Posição na lista (0-based) e total, para o índice e mover para cima/baixo. */
  position: number
  total: number
  /** Avanço e atraso vindos do acompanhamento; ausente enquanto carrega. */
  summary: StageSummary | undefined
  photoCount: number
  canMutate: boolean
  onEdit: (stage: Stage) => void
  onDelete: (stage: Stage) => void
  onStatus: (stage: Stage, status: EtapaStatus) => void
  onMove: (stage: Stage, direction: -1 | 1) => void
}

/**
 * Uma etapa na lista do ciclo (DS v2): índice grande, nome, datas, trena com o
 * avanço real, status trocado no próprio pill e — como alternativa ao arraste
 * — mover para cima/baixo. Abre para mostrar descrição, tarefas e fotos.
 */
export function StageRow(props: StageRowProps) {
  const { stage, position, total, summary, photoCount, canMutate } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: !canMutate,
  })

  const progress = summary?.progress ?? 0
  const daysLate = summary?.daysLate ?? 0
  const late = daysLate > 0
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div className={card({ late, dragging: isDragging })}>
        <span className={rail({ state: late ? "late" : stage.status })} />
        <div className="grid grid-cols-[28px_52px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 py-4 pr-4 pl-2 sm:grid-cols-[28px_60px_minmax(0,1fr)_minmax(0,220px)_auto] sm:pr-5">
          {canMutate ? (
            <button
              type="button"
              aria-label={t("obra.etapas.actions.reorder")}
              className="flex h-10 w-7 cursor-grab touch-none items-center justify-center rounded-[8px] text-meta hover:bg-raised hover:text-ink active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </button>
          ) : (
            <span aria-hidden="true" />
          )}

          <span className={index({ done: stage.status === EtapaStatus.DONE })}>{String(position + 1).padStart(2, "0")}</span>

          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 cursor-pointer text-left">
            <span className="t-section flex items-center gap-2 text-[16px] text-ink">
              <span className="truncate">{stage.name}</span>
              <ChevronDown size={15} className={chevron({ open })} />
            </span>
            <span className="t-num mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-meta">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : "—"} →{" "}
                {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : "—"}
              </span>
              {late && (
                <span className="font-[620] text-danger">{t("obra.visaoGeral.attention.daysLate", { count: daysLate })}</span>
              )}
            </span>
          </button>

          <div className="col-span-3 flex items-center gap-3 sm:col-span-1">
            <Progress
              value={progress}
              height={8}
              tone={tapeTone(late, stage.status === EtapaStatus.DONE)}
              label={t("obra.etapas.card.progressOf", { name: stage.name })}
              className="flex-1"
            />
            <span className="t-data w-9 text-right text-ink">{summary ? `${progress}%` : "—"}</span>
          </div>

          <div className="col-span-3 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
            <StageStatusSelect stage={stage} canEdit={canMutate} onChange={(status) => props.onStatus(stage, status)} />
            {canMutate && (
              <div className="flex items-center transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <button type="button" onClick={() => props.onMove(stage, -1)} disabled={position === 0} aria-label={t("obra.etapas.actions.moveUp")} className={iconAction()}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" onClick={() => props.onMove(stage, 1)} disabled={position === total - 1} aria-label={t("obra.etapas.actions.moveDown")} className={iconAction()}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" onClick={() => props.onEdit(stage)} aria-label={t("obra.etapas.actions.edit")} className={iconAction()}>
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => props.onDelete(stage)} aria-label={t("obra.etapas.actions.delete")} className={iconAction({ danger: true })}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 border-t border-border bg-raised/50 px-5 py-4 text-[13.5px] text-ink-2 sm:pl-[104px]">
                {stage.description && <p className="max-w-[70ch]">{stage.description}</p>}
                <p className="t-num">
                  {summary && summary.totalTarefas > 0
                    ? t("obra.visaoGeral.current.tasks", { done: summary.taskStatusCounts.DONE ?? 0, total: summary.totalTarefas })
                    : t("obra.etapas.tasksEmpty")}
                  {" · "}
                  {t("obra.etapas.card.photosCount", { count: photoCount })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  )
}
