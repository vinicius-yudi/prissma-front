import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatDate } from "@/shared/utils/formatters"
import { daysLate, deriveStatus } from "@/shared/utils/status"

import type { Stage } from "../services/stages.service"
import { stageProgress } from "../utils/stageProgress"

/**
 * Uma etapa, como linha da lista ordenável.
 *
 * Era um card em grade agrupada por status; virou linha porque a ordem **é** a
 * informação — o ciclo da obra é uma sequência, e uma grade de três colunas
 * embaralhava a leitura de "o que vem antes do quê". A ordem se muda arrastando
 * pela alça; o status, pelo formulário.
 *
 * A alça é o único ponto de arraste (`listeners` só nela): com a linha inteira
 * arrastável, no celular qualquer rolagem virava um drag.
 */

const NO_DATE = "—"

const card = tv({
  base: "group relative rounded-2xl border bg-surface-container-low p-4 transition-colors hover:border-outline",
  variants: {
    late: {
      true: "border-danger/50 shadow-[inset_3px_0_0_var(--color-danger-solid)]",
      false: "border-outline-variant",
    },
    dragging: {
      true: "ring-2 ring-primary/40",
      false: "",
    },
  },
})

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" data-no-card-click>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("obra.etapas.actions.menu")}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          {/* Camada de captura: fecha ao clicar fora sem precisar de listener
              global no documento. */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-outline-variant bg-surface-container-highest py-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-on-surface hover:bg-tint"
            >
              <Pencil size={14} />
              {t("obra.etapas.actions.edit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
            >
              <Trash2 size={14} />
              {t("obra.etapas.actions.delete")}
            </button>
          </div>
        </>
      )}
    </div>
  )
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: disableDrag,
  })

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
    if ((e.target as HTMLElement).closest("[data-no-card-click]")) return
    onClick?.(stage)
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={card({ late: late > 0, dragging: isDragging })}
    >
      <div className="grid grid-cols-[24px_1fr_36px] items-center gap-x-3 gap-y-3 lg:grid-cols-[24px_1.4fr_1fr_1.3fr_130px_36px] lg:gap-4">
        {!disableDrag ? (
          <button
            type="button"
            data-no-card-click
            aria-label={t("obra.etapas.actions.reorder")}
            className="flex size-6 cursor-grab touch-none items-center justify-center rounded text-on-surface-faint active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        ) : (
          <span aria-hidden />
        )}

        <div className="flex min-w-0 items-center gap-3">
          <Num className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-[12px] font-bold text-on-surface-variant">
            {stage.displayOrder}
          </Num>
          <div className="min-w-0">
            <h3 className="truncate text-[14.5px] font-semibold text-on-surface">{stage.name}</h3>
            <p className="truncate text-[11.5px] text-on-surface-faint">
              {stage.description || t("obra.etapas.card.photosCount", { count: photoCount })}
            </p>
          </div>
        </div>

        {/* No celular badge, progresso e datas descem para uma faixa própria
            abaixo do nome; no desktop viram colunas da mesma linha. */}
        <div className="col-start-2 lg:col-start-auto">
          <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />
          {late > 0 && (
            <p className="mt-1.5 text-[10.5px] font-semibold text-danger">
              ⚠ {t("obra.visaoGeral.lateBy", { count: late })}
            </p>
          )}
        </div>

        <div className="col-start-2 lg:col-start-auto">
          <div className="flex items-center justify-between text-[11px] text-on-surface-faint">
            <span>{t("obra.etapas.card.progress")}</span>
            <Num className={late > 0 ? "font-semibold text-danger" : "font-semibold"}>
              {progress}%
            </Num>
          </div>
          <div className="mt-1.5">
            <Progress
              value={progress}
              height={6}
              tone={stageTone}
              label={t("obra.etapas.card.progress")}
            />
          </div>
        </div>

        <Num className="col-start-2 text-[11.5px] text-on-surface-variant lg:col-start-auto lg:text-right">
          {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : NO_DATE}
          {" – "}
          {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : NO_DATE}
        </Num>

        <div className="col-start-3 row-start-1 flex justify-end lg:col-start-auto lg:row-start-auto">
          {canMutate && (
            <RowMenu onEdit={() => onClick?.(stage)} onDelete={() => onDelete?.(stage)} />
          )}
        </div>
      </div>
    </li>
  )
}
