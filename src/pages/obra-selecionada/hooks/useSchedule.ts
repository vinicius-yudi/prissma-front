import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"

import { ProjectPermission } from "../services/projectPermissions.service"
import {
  deleteAllocation,
  getSchedule,
  updateResponsibility,
  upsertAllocation,
} from "../services/schedule.service"
import { ScheduleView, type TeamSchedule } from "../types/schedule"
import { useProjectPermissions } from "./useProjectPermissions"

/**
 * Dados do Schedule dos integrantes.
 *
 * `view` e `date` vivem na URL: descrevem o que a tela está mostrando, então
 * recarregar ou compartilhar o link não pode perder a vista (CLAUDE.md §8).
 * `date` é uma data de **referência** — quem normaliza para a segunda-feira ou
 * para o dia 1 é o backend, e é dele que saem `previousDate`/`nextDate`. O
 * cliente não faz aritmética de data em lugar nenhum.
 */

export function scheduleKey(projectId: number, view: ScheduleView, date: string | null) {
  return ["schedule", projectId, view, date] as const
}

export interface SaveAllocationInput {
  userId: number
  date: string
  /** 0 libera o dia — vira DELETE, porque no banco `hours` é sempre > 0. */
  hours: number
}

export interface SaveResponsibilityInput {
  userId: number
  userResponsibility: string
}

export interface UseScheduleResult {
  schedule: TeamSchedule | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
  view: ScheduleView
  setView: (view: ScheduleView) => void
  goPrevious: () => void
  goNext: () => void
  canMutate: boolean
  saveAllocation: (input: SaveAllocationInput) => void
  saveResponsibility: (input: SaveResponsibilityInput) => void
  isSaving: boolean
}

export function useSchedule(projectId: number): UseScheduleResult {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAdmin, can } = useProjectPermissions(projectId)

  const view =
    searchParams.get("view") === ScheduleView.MONTH ? ScheduleView.MONTH : ScheduleView.WEEK
  const date = searchParams.get("date")

  const query = useQuery({
    queryKey: scheduleKey(projectId, view, date),
    queryFn: () => getSchedule(projectId, { view, date: date ?? undefined }),
    enabled: projectId > 0,
    // Sem isto, cada clique na seta apaga a grade inteira e devolve o
    // esqueleto — o período muda, mas a tela não deveria piscar.
    placeholderData: keepPreviousData,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["schedule", projectId] })
  }

  function notifyError(error: Error) {
    toast.error(error.message)
  }

  function setView(next: ScheduleView) {
    const params = new URLSearchParams(searchParams)
    params.set("view", next)
    // A data de referência é do período antigo: levada para a outra view,
    // abriria um mês que ninguém pediu.
    params.delete("date")
    setSearchParams(params)
  }

  function goTo(reference: string) {
    const params = new URLSearchParams(searchParams)
    params.set("view", view)
    params.set("date", reference)
    setSearchParams(params)
  }

  const allocationMutation = useMutation({
    mutationFn: (input: SaveAllocationInput) =>
      upsertAllocation({
        projectId,
        userId: input.userId,
        date: input.date,
        allocatedHours: input.hours,
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.schedule.toast.allocationSaved"))
    },
    onError: notifyError,
  })

  const clearMutation = useMutation({
    mutationFn: (input: SaveAllocationInput) =>
      deleteAllocation({ projectId, userId: input.userId, date: input.date }),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.schedule.toast.allocationCleared"))
    },
    onError: notifyError,
  })

  const responsibilityMutation = useMutation({
    mutationFn: (input: SaveResponsibilityInput) =>
      updateResponsibility({
        projectId,
        userId: input.userId,
        // Em branco é "sem responsabilidade": o backend normaliza para null, e
        // mandar null explicitamente deixa a intenção clara na requisição.
        userResponsibility: input.userResponsibility.trim() || null,
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.schedule.toast.responsibilitySaved"))
    },
    onError: notifyError,
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
    view,
    setView,
    goPrevious: () => {
      if (query.data) goTo(query.data.previousDate)
    },
    goNext: () => {
      if (query.data) goTo(query.data.nextDate)
    },
    canMutate: isAdmin || can(ProjectPermission.MANAGE_TEAMS),
    saveAllocation: (input) => {
      if (input.hours === 0) {
        clearMutation.mutate(input)
        return
      }
      allocationMutation.mutate(input)
    },
    saveResponsibility: (input) => responsibilityMutation.mutate(input),
    isSaving:
      allocationMutation.isPending ||
      clearMutation.isPending ||
      responsibilityMutation.isPending,
  }
}
