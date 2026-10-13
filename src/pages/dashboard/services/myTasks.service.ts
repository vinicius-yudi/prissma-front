import { api } from "@/lib/api"

/** Tarefa atribuída ao usuário, em qualquer obra (`GET /users/me/tasks`). */
export interface MyTask {
  id: number
  projectId: number
  stageId: number
  stageName: string
  title: string
  priority: string
  status: string
  plannedStartDate: string | null
  plannedEndDate: string | null
}

export function getMyTasks(): Promise<MyTask[]> {
  return api.get<MyTask[]>("/users/me/tasks")
}
