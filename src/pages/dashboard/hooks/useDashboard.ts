import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { listProjects } from "@/pages/projetos/services/projects.service"
import { ProjectStatus } from "@/shared/types/project"

import { getMyTasks } from "../services/tasks.service"
import type { DashboardTask } from "../types"

export function useDashboard() {
  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  const { data: myTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["myTasks"],
    queryFn: getMyTasks,
  })

  const activeCount = useMemo(() => allProjects.length, [allProjects])

  const inProgressProjects = useMemo(
    () => allProjects.filter((p) => p.status === ProjectStatus.IN_PROGRESS),
    [allProjects],
  )

  const tasks = useMemo<DashboardTask[]>(() => {
    const titleById = new Map(allProjects.map((p) => [p.id, p.title]))
    return myTasks.map((task) => ({
      ...task,
      projectTitle: titleById.get(task.projectId) ?? null,
    }))
  }, [myTasks, allProjects])

  const pendingTasksCount = useMemo(
    () => tasks.filter((task) => task.status !== "DONE").length,
    [tasks],
  )

  return {
    activeCount,
    inProgressProjects,
    isLoading,
    tasks,
    isLoadingTasks,
    pendingTasksCount,
  }
}
