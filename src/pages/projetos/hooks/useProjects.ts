import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { ProjectStatus, type Project } from "@/shared/types/project"

import { listProjects } from "../services/projects.service"
import { ProjectFilter } from "../types"

export interface ProjectStats {
  total: number
  inProgress: number
  completed: number
  overdue: number
}

function isProjectOverdue(project: Project): boolean {
  if (!project.plannedEndDate) return false
  if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CANCELLED) return false
  return new Date(project.plannedEndDate) < new Date()
}

export function useProjects() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ProjectFilter>(ProjectFilter.ALL)

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  const allProjects = query.data ?? []

  const stats = useMemo<ProjectStats>(
    () => ({
      total: allProjects.length,
      inProgress: allProjects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length,
      completed: allProjects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
      overdue: allProjects.filter(isProjectOverdue).length,
    }),
    [allProjects],
  )

  const projects = useMemo(() => {
    const byFilter = allProjects.filter((p) => {
      if (filter === ProjectFilter.IN_PROGRESS) return p.status === ProjectStatus.IN_PROGRESS
      if (filter === ProjectFilter.COMPLETED) return p.status === ProjectStatus.COMPLETED
      if (filter === ProjectFilter.OVERDUE) return isProjectOverdue(p)
      return true
    })

    if (!search.trim()) return byFilter

    const term = search.toLowerCase()
    return byFilter.filter(
      (p) =>
        p.title.toLowerCase().includes(term) || p.address.toLowerCase().includes(term),
    )
  }, [allProjects, filter, search])

  return {
    projects,
    isLoading: query.isLoading,
    isError: query.isError,
    search,
    setSearch,
    filter,
    setFilter,
    stats,
  }
}
