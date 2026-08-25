import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Image as ImageIcon, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatDate } from "@/shared/utils/formatters"
import { daysLate, deriveStatus } from "@/shared/utils/status"

import type { Stage } from "../services/stages.service"
import { stageProgress } from "../utils/stageProgress"

const card = tv({
  base: "group relative space-y-3 rounded-xl border bg-surface-container-low p-5 transition-colors hover:bg-surface-container",
  variants: {
    late: {
      true: "border-danger/50 shadow-[inset_3px_0_0_var(--color-danger-solid)]",
      false: "border-outline-variant",
    },
    draggable: {
      true: "cursor-grab active:cursor-grabbing",
      false: "cursor-pointer",
    },
    dragging: {
      true: "ring-2 ring-primary/40",
      false: "",
    },
  },
})

interface EtapaCardProps {
  stage: Stage
  photoCount: number
  onClick?: (stage: Stage) => void
  onDelete?: (stage: Stage) => void
  disableDrag?: boolean
  canMutate?: boolean
}

export function EtapaCard({
  stage,
  photoCount,
  onClick,
  onDelete,
  disableDrag,
  canMutate,
}: EtapaCardProps) {
  const { t } = useTranslation()
  const sortable = useSortable({ id: stage.id, disabled: disableDrag })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  const progress = stageProgress(stage)

  // O preenchimento segue o estado: ouro no curso normal, verde ao concluir,
  // vermelho em atraso (Style Guide v2 §5).
  const { state } = deriveStatus({ status: stage.status, plannedEndDate: stage.plannedEndDate })
  const stageTone = state === "late" ? "danger" : state === "done" ? "ok" : "gold"
  const late = state === "late" ? daysLate(stage.plannedEndDate) : 0

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return
    if ((e.target as HTMLElement).closest("[data-no-card-click]")) return
    onClick?.(stage)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete?.(stage)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    onClick?.(stage)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={card({ late: late > 0, draggable: !disableDrag, dragging: isDragging })}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 pr-2">
          <Num className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-outline bg-surface-container-high text-[11px] font-bold text-on-surface-variant">
            {stage.displayOrder}
          </Num>
          <div className="min-w-0 space-y-1">
          <h3 className="font-semibold text-on-surface truncate">{stage.name}</h3>
          {stage.description && (
            <p className="text-sm text-on-surface-variant line-clamp-1">
              {stage.description}
            </p>
          )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />
          {canMutate && (
            <div
              data-no-card-click
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleEdit}
                aria-label={t("obra.etapas.actions.edit")}
                title={t("obra.etapas.actions.edit")}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleDelete}
                aria-label={t("obra.etapas.actions.delete")}
                title={t("obra.etapas.actions.delete")}
                className="p-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span>{t("obra.etapas.card.progress")}</span>
          <Num className="font-semibold">{progress}%</Num>
        </div>
        <Progress
          value={progress}
          height={6}
          tone={stageTone}
          label={t("obra.etapas.card.progress")}
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Calendar size={12} />
        <Num>
          {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : "—"}
          {" → "}
          {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : "—"}
        </Num>
      </div>

      {late > 0 && (
        <p className="text-[10.5px] font-semibold text-danger">
          {t("obra.visaoGeral.lateBy", { count: late })}
        </p>
      )}

      <div className="flex items-center justify-end text-xs text-on-surface-variant pt-1">
        <span className="flex items-center gap-1.5">
          <ImageIcon size={12} />
          {t("obra.etapas.card.photosCount", { count: photoCount })}
        </span>
      </div>
    </div>
  )
}
