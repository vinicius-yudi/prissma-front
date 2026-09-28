import { useState } from "react"

import { useSchedule } from "../hooks/useSchedule"
import type { DaySchedule, MemberSchedule } from "../types/schedule"
import { AllocationModal } from "./AllocationModal"
import { ResponsibilityModal } from "./ResponsibilityModal"
import { ScheduleEmptyState } from "./ScheduleEmptyState"
import { ScheduleErrorState } from "./ScheduleErrorState"
import { ScheduleGrid } from "./ScheduleGrid"
import { ScheduleLegend } from "./ScheduleLegend"
import { ScheduleLoadingState } from "./ScheduleLoadingState"
import { ScheduleToolbar } from "./ScheduleToolbar"

/**
 * Schedule dos integrantes (Telas v2 §15).
 *
 * Orquestra: os dados e o estado de URL vêm de `useSchedule`, o desenho está
 * nos filhos. Aqui só ficam os dois modais e a escolha de qual célula está
 * aberta.
 */

interface AllocationTarget {
  member: MemberSchedule
  day: DaySchedule
}

export function ScheduleTab({ projectId }: { projectId: number }) {
  const schedule = useSchedule(projectId)
  const [allocating, setAllocating] = useState<AllocationTarget | null>(null)
  const [editingMember, setEditingMember] = useState<MemberSchedule | null>(null)

  if (schedule.isLoading) {
    return <ScheduleLoadingState />
  }

  if (schedule.isError || !schedule.schedule) {
    return <ScheduleErrorState onRetry={schedule.refetch} />
  }

  const data = schedule.schedule

  function handleSaveAllocation(hours: number) {
    if (!allocating) return
    schedule.saveAllocation({ userId: allocating.member.userId, date: allocating.day.date, hours })
    setAllocating(null)
  }

  function handleSaveResponsibility(userResponsibility: string) {
    if (!editingMember) return
    schedule.saveResponsibility({ userId: editingMember.userId, userResponsibility })
    setEditingMember(null)
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-[22px]">
      <ScheduleToolbar
        schedule={data}
        onViewChange={schedule.setView}
        onPrevious={schedule.goPrevious}
        onNext={schedule.goNext}
      />

      {data.members.length === 0 ? (
        <ScheduleEmptyState projectId={projectId} />
      ) : (
        <>
          <ScheduleGrid
            schedule={data}
            canMutate={schedule.canMutate}
            onSelectDay={(member, day) => setAllocating({ member, day })}
            onEditResponsibility={setEditingMember}
          />
          <ScheduleLegend />
        </>
      )}

      {/* `key` por célula: o formulário nasce com as horas do dia aberto sem
          precisar de um effect de reset (CLAUDE.md §4). */}
      {allocating && (
        <AllocationModal
          key={`${allocating.member.userId}-${allocating.day.date}`}
          member={allocating.member}
          day={allocating.day}
          isSaving={schedule.isSaving}
          onClose={() => setAllocating(null)}
          onSave={handleSaveAllocation}
        />
      )}

      {editingMember && (
        <ResponsibilityModal
          key={editingMember.userId}
          member={editingMember}
          isSaving={schedule.isSaving}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveResponsibility}
        />
      )}
    </section>
  )
}
