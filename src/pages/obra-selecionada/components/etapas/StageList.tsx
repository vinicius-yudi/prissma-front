import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import type { EtapaStatus } from "@/pages/projetos/types"

import type { Stage } from "../../services/stages.service"
import { StageRow } from "./StageRow"

interface StageListProps {
  stages: Stage[]
  summaries: Map<number, StageSummary>
  photoCountByStage: Map<number, number>
  canMutate: boolean
  onReorder: (stage: Stage, orderedIds: number[]) => void
  onStatus: (stage: Stage, status: EtapaStatus) => void
  onEdit: (stage: Stage) => void
  onDelete: (stage: Stage) => void
}

/**
 * Etapas em uma lista só, na ordem do ciclo — a ordem **é** a informação.
 * Arrastar pela alça reordena; teclado e os botões subir/descer fazem o mesmo
 * sem arraste. No toque o arraste espera uma pressão longa, para rolar a
 * página não virar drag.
 */
export function StageList({ stages, summaries, photoCountByStage, canMutate, onReorder, onStatus, onEdit, onDelete }: StageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function reorderTo(stage: Stage, from: number, to: number) {
    if (to < 0 || to >= stages.length || from === to) return
    onReorder(stage, arrayMove(stages, from, to).map((s) => s.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = stages.findIndex((s) => s.id === Number(active.id))
    const to = stages.findIndex((s) => s.id === Number(over.id))
    if (from === -1 || to === -1) return
    reorderTo(stages[from], from, to)
  }

  function handleMove(stage: Stage, direction: -1 | 1) {
    const from = stages.findIndex((s) => s.id === stage.id)
    reorderTo(stage, from, from + direction)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2.5 p-0">
          {stages.map((stage, position) => (
            <StageRow
              key={stage.id}
              stage={stage}
              position={position}
              total={stages.length}
              summary={summaries.get(stage.id)}
              photoCount={photoCountByStage.get(stage.id) ?? 0}
              canMutate={canMutate}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatus={onStatus}
              onMove={handleMove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
