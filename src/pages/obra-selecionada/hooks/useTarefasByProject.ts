import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query"
import { listStages } from "../services/stages.service"
import { getTarefas } from "../services/tarefas.service"

export function useTarefasByProject(projectId: number | null) {
  const queryClient = useQueryClient()

  const stagesQuery = useQuery({
    queryKey: ["stages", projectId],
    queryFn: () => listStages(projectId!),
    enabled: projectId !== null && projectId > 0,
  })

  const stages = stagesQuery.data ?? []

  const tasksQueries = useQueries({
    queries: stages.map((stage) => ({
      queryKey: ["tarefas", stage.id],
      queryFn: () => getTarefas(stage.id),
      enabled: true,
    })),
  })

  const stagesWithTasks = stages.map((stage, idx) => ({
    stage,
    tasks: tasksQueries[idx]?.data ?? [],
    isLoading: tasksQueries[idx]?.isLoading ?? false,
    error: tasksQueries[idx]?.error ?? null,
  }))

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ["stages", projectId] })
    queryClient.invalidateQueries({ queryKey: ["tarefas"] })
  }

  return {
    stages: stagesWithTasks,
    isLoading: stagesQuery.isLoading || tasksQueries.some((q) => q.isLoading),
    error: stagesQuery.error,
    refetch: refetchAll,
  }
}
