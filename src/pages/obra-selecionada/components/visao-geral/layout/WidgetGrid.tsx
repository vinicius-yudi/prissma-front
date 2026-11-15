import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { WIDGETS_BY_ID, type WidgetContext } from "../widgets/registry"
import {
  hide,
  move,
  moveAfter,
  step,
  toggleSize,
  type OverviewLayout,
  type WidgetPlacement,
  type WidgetSize,
} from "./layoutModel"
import { SortableWidget } from "./SortableWidget"

const COLUMN_PREFIX = "column:"

const column = tv({
  base: "flex min-w-0 flex-col gap-6",
  variants: {
    editing: { true: "min-h-32 rounded-lg" },
    over: { true: "bg-gold-soft/40" },
  },
})

interface WidgetGridProps {
  layout: OverviewLayout
  ctx: WidgetContext
  editing: boolean
  canSee: (widgetId: string) => boolean
  onChange: (change: (layout: OverviewLayout) => OverviewLayout) => void
}

/**
 * As duas colunas da Visão Geral (principal 8/12, lateral 4/12), agora vindas
 * do layout: widget "wide" mora na principal, "narrow" na lateral, na ordem da
 * lista. Abaixo de xl as colunas empilham, como sempre foi.
 *
 * Arrastar para a outra coluna troca o tamanho do widget; soltar sobre a área
 * vazia de uma coluna manda o widget para o fim dela.
 */
export function WidgetGrid({ layout, ctx, editing, canSee, onChange }: WidgetGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const shown = layout.widgets.filter((w) => w.visible && canSee(w.id))
  const main = shown.filter((w) => w.size === "wide")
  const side = shown.filter((w) => w.size === "narrow")

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const placement = layout.widgets.find((w) => w.id === activeId)
    if (!placement) return

    onChange((current) => {
      let next = current
      if (overId.startsWith(COLUMN_PREFIX)) {
        const target = overId.slice(COLUMN_PREFIX.length) as WidgetSize
        const columnItems = (target === "wide" ? main : side).filter((w) => w.id !== activeId)
        const last = columnItems[columnItems.length - 1]
        if (last) next = moveAfter(next, activeId, last.id)
        return placement.size === target ? next : toggleSize(next, activeId)
      }
      if (overId === activeId) return next
      const overPlacement = next.widgets.find((w) => w.id === overId)
      next = move(next, activeId, overId)
      return overPlacement && overPlacement.size !== placement.size ? toggleSize(next, activeId) : next
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Column size="wide" items={main} ctx={ctx} editing={editing} canSee={canSee} onChange={onChange} />
        <Column size="narrow" items={side} ctx={ctx} editing={editing} canSee={canSee} onChange={onChange} />
      </div>
    </DndContext>
  )
}

interface ColumnProps {
  size: WidgetSize
  items: WidgetPlacement[]
  ctx: WidgetContext
  editing: boolean
  canSee: (widgetId: string) => boolean
  onChange: (change: (layout: OverviewLayout) => OverviewLayout) => void
}

function Column({ size, items, ctx, editing, canSee, onChange }: ColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${size}`, disabled: !editing })
  const inColumn = (layout: OverviewLayout) => (id: string) =>
    layout.widgets.some((w) => w.id === id && w.visible && w.size === size && canSee(id))

  return (
    <div ref={setNodeRef} className={column({ editing, over: editing && isOver })} data-column={size}>
      <SortableContext items={items.map((w) => w.id)} strategy={verticalListSortingStrategy}>
        {items.map((placement, index) => {
          const definition = WIDGETS_BY_ID.get(placement.id)
          if (!definition) return null
          const content = definition.render(ctx)
          // Sem conteúdo agora (ex.: nenhuma etapa em andamento): some da tela,
          // mas na edição aparece um marcador para dar para mover ou remover.
          if (content === null && !editing) return null
          const title = t(`obra.visaoGeral.widgets.${placement.id}.title`)

          return (
            <SortableWidget
              key={placement.id}
              id={placement.id}
              title={title}
              size={placement.size}
              editing={editing}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange((l) => step(l, placement.id, -1, inColumn(l)))}
              onMoveDown={() => onChange((l) => step(l, placement.id, 1, inColumn(l)))}
              onToggleSize={() => onChange((l) => toggleSize(l, placement.id))}
              onRemove={() => onChange((l) => hide(l, placement.id))}
            >
              {content ?? (
                <section className="rounded-lg bg-surface p-5 hairline sm:p-6">
                  <p className="t-section text-ink">{title}</p>
                  <p className="mt-1 text-[13.5px] text-meta">{t("obra.visaoGeral.customize.nothingNow")}</p>
                </section>
              )}
            </SortableWidget>
          )
        })}
      </SortableContext>
      {editing && items.length === 0 && (
        <p className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border-strong px-4 text-center text-[13px] text-meta">
          {t("obra.visaoGeral.customize.dropHere")}
        </p>
      )}
    </div>
  )
}
