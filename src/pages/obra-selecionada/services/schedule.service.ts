import { api } from "@/lib/api"

import type {
  ScheduleAllocation,
  ScheduleMemberInfo,
  ScheduleView,
  TeamSchedule,
} from "../types/schedule"

/**
 * Transporte do Schedule dos integrantes. Nenhuma regra mora aqui — validação
 * de horas é do zod (e do backend), decisão entre gravar e liberar é do hook.
 */

function scheduleBase(projectId: number): string {
  return `/projects/${projectId}/schedule`
}

function allocationPath(projectId: number, userId: number, date: string): string {
  return `${scheduleBase(projectId)}/members/${userId}/allocations/${date}`
}

export async function getSchedule(
  projectId: number,
  params: { view: ScheduleView; date?: string },
): Promise<TeamSchedule> {
  // `URLSearchParams` e não concatenação: um `date` vazio viraria `?date=` e o
  // backend responderia 400 em vez de assumir hoje.
  const query = new URLSearchParams({ view: params.view })
  if (params.date) {
    query.set("date", params.date)
  }

  return api.get<TeamSchedule>(`${scheduleBase(projectId)}?${query.toString()}`)
}

export async function upsertAllocation(input: {
  projectId: number
  userId: number
  date: string
  allocatedHours: number
}): Promise<ScheduleAllocation> {
  return api.put<ScheduleAllocation>(
    allocationPath(input.projectId, input.userId, input.date),
    { allocatedHours: input.allocatedHours },
  )
}

/** Libera o dia. Dia livre é ausência de linha — não existe alocação de 0h. */
export async function deleteAllocation(input: {
  projectId: number
  userId: number
  date: string
}): Promise<void> {
  return api.delete<void>(allocationPath(input.projectId, input.userId, input.date))
}

export async function updateResponsibility(input: {
  projectId: number
  userId: number
  userResponsibility: string | null
}): Promise<ScheduleMemberInfo> {
  return api.put<ScheduleMemberInfo>(
    `${scheduleBase(input.projectId)}/members/${input.userId}/responsibility`,
    { userResponsibility: input.userResponsibility },
  )
}
