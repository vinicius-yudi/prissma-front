import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Image as ImageIcon, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { EtapaStatus } from "@/pages/projetos/types"

import type { Stage } from "../services/stages.service"

const ETAPA_STATUS_KEY: Record<EtapaStatus, string> = {
  PLANNED: "obra.etapas.etapaStatus.PLANNED",
  IN_PROGRESS: "obra.etapas.etapaStatus.IN_PROGRESS",
  DONE: "obra.etapas.etapaStatus.DONE",
  BLOCKED: "obra.etapas.etapaStatus.BLOCKED",
}

const etapaStatusBadge = tv({
  base: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0",
  variants: {
    status: {
      PLANNED: "bg-tertiary/10 text-tertiary border-tertiary/20",
      IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      DONE: "bg-secondary/10 text-secondary border-secondary/20",
      BLOCKED: "bg-error/10 text-error border-error/20",
    },
  },
})

const progressBar = tv({
  base: "h-1.5 rounded-full transition-[width]",
  variants: {
    status: {
      PLANNED: "bg-on-surface-variant",
      IN_PROGRESS: "bg-primary",
      DONE: "bg-secondary",
      BLOCKED: "bg-error",
    },
  },
})

function formatDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function computeProgress(stage: Stage): number {
  switch (stage.status) {
    case "DONE":
      return 100
    case "IN_PROGRESS":
      return 50
    case "BLOCKED":
    case "PLANNED":
    default:
      return 0
  }
}

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

  const progress = computeProgress(stage)

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
      className={`group relative bg-surface-container-low rounded-xl p-5 space-y-3 ${
        disableDrag ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } hover:bg-surface-container transition-colors border border-outline-variant/10 ${
        isDragging ? "ring-2 ring-primary/40" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 pr-2">
          <h3 className="font-semibold text-on-surface truncate">{stage.name}</h3>
          {stage.description && (
            <p className="text-sm text-on-surface-variant line-clamp-1">
              {stage.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={etapaStatusBadge({ status: stage.status })}>
            {t(ETAPA_STATUS_KEY[stage.status])}
          </span>
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
          <span className="font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={progressBar({ status: stage.status })}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Calendar size={12} />
        {formatDate(stage.plannedStartDate)}
        {" - "}
        {formatDate(stage.plannedEndDate)}
      </div>

      <div className="flex items-center justify-end text-xs text-on-surface-variant pt-1">
        <span className="flex items-center gap-1.5">
          <ImageIcon size={12} />
          {t("obra.etapas.card.photosCount", { count: photoCount })}
        </span>
      </div>
    </div>
  )
}
