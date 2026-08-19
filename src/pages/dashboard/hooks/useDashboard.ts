import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { ProjectStatus } from "@/shared/types/project"
import { listProjects } from "@/pages/projetos/services/projects.service"

export function useDashboard() {
  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  const activeCount = useMemo(() => allProjects.length, [allProjects])

  const inProgressProjects = useMemo(
    () => allProjects.filter((p) => p.status === ProjectStatus.IN_PROGRESS),
    [allProjects],
  )

  return { activeCount, inProgressProjects, isLoading }
}
