import { useQuery } from "@tanstack/react-query"

import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"
import { useProjectList } from "@/shared/hooks/useProjectList"

import { getMyTasks } from "../services/myTasks.service"
import { buildAlerts, buildWeek, openTasks } from "../utils/dashboardData"
import type { Alert, WeekDay } from "../utils/dashboardData"

export interface DashboardData {
  isLoading: boolean
  inProgress: Project[]
  planningCount: number
  completedCount: number
  totalCount: number
  openTaskCount: number
  weekTaskCount: number
  alerts: Alert[]
  week: WeekDay[]
}

/**
 * Início: obras da conta + tarefas atribuídas a mim. Tudo o que a tela mostra
 * sai desses dois endpoints — nada de número fixo.
 */
export function useDashboard(): DashboardData {
  const projects = useProjectList()
  const tasksQuery = useQuery({ queryKey: ["me", "tasks"], queryFn: getMyTasks })
  const tasks = tasksQuery.data ?? []
  const week = buildWeek(tasks, projects)

  return {
    isLoading: tasksQuery.isLoading,
    inProgress: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS),
    planningCount: projects.filter((p) => p.status === ProjectStatus.PLANNING).length,
    completedCount: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
    totalCount: projects.length,
    openTaskCount: openTasks(tasks).length,
    weekTaskCount: week.reduce((sum, day) => sum + day.tasks.length, 0),
    alerts: buildAlerts(tasks, projects),
    week,
  }
}
