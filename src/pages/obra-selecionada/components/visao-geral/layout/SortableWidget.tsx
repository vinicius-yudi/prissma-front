import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowLeftRight, ArrowUp, GripVertical, X } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { IconButton } from "@/shared/components/ui/icon-button/IconButton"

import type { WidgetSize } from "./layoutModel"

const frame = tv({
  base: "relative min-w-0",
  variants: {
    editing: { true: "rounded-lg outline-2 outline-offset-4 outline-dashed outline-border-strong" },
    dragging: { true: "z-10 opacity-80 shadow-xl" },
  },
})

interface SortableWidgetProps {
  id: string
  title: string
  size: WidgetSize
  editing: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleSize: () => void
  onRemove: () => void
  children: ReactNode
}

/**
 * Um widget no grid. Fora da edição é só o card. Na edição ganha a barra de
 * controles acima dele — alça de arrastar, ↑↓, trocar de coluna e remover — e
 * o conteúdo fica inerte: ninguém segue um link sem querer no meio do arraste.
 *
 * ↑↓ existem além do arraste: são o caminho no celular e a alternativa
 * explícita ao teclado (a alça também responde a espaço + setas).
 */
export function SortableWidget({
  id,
  title,
  size,
  editing,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleSize,
  onRemove,
  children,
}: SortableWidgetProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={frame({ editing, dragging: isDragging })}
      data-widget={id}
    >
      {editing && (
        <div className="mb-2 flex items-center gap-1 rounded-md bg-raised px-1.5 py-1 hairline">
          <IconButton
            ref={setActivatorNodeRef}
            label={t("obra.visaoGeral.customize.drag", { title })}
            className="size-9 cursor-grab touch-none active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </IconButton>
          <span className="min-w-0 flex-1 truncate text-[13px] font-[600] text-ink">{title}</span>
          <IconButton label={t("obra.visaoGeral.customize.moveUp", { title })} className="size-9" disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp size={15} />
          </IconButton>
          <IconButton
            label={t("obra.visaoGeral.customize.moveDown", { title })}
            className="size-9"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDown size={15} />
          </IconButton>
          <IconButton
            label={t(size === "wide" ? "obra.visaoGeral.customize.toSide" : "obra.visaoGeral.customize.toMain", { title })}
            className="hidden size-9 xl:inline-flex"
            onClick={onToggleSize}
          >
            <ArrowLeftRight size={15} />
          </IconButton>
          <IconButton label={t("obra.visaoGeral.customize.remove", { title })} className="size-9 hover:text-danger" onClick={onRemove}>
            <X size={16} />
          </IconButton>
        </div>
      )}
      <div inert={editing} className={editing ? "pointer-events-none select-none" : undefined}>
        {children}
      </div>
    </div>
  )
}
