import { api } from "@/lib/api"

import type { MyTask } from "../types"

export async function getMyTasks(): Promise<MyTask[]> {
  return api.get<MyTask[]>("/users/me/tasks")
}
