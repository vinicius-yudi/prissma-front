import { api } from "@/lib/api"
import type { CreateTarefaRequest, Tarefa, UpdateTarefaRequest } from "../types/tarefas"

export async function getTarefas(stageId: number): Promise<Tarefa[]> {
  return api.get<Tarefa[]>(`/stages/${stageId}/tasks`)
}

export async function getTarefa(stageId: number, tarefaId: number): Promise<Tarefa> {
  return api.get<Tarefa>(`/stages/${stageId}/tasks/${tarefaId}`)
}

export async function createTarefa(
  stageId: number,
  data: CreateTarefaRequest
): Promise<Tarefa> {
  return api.post<Tarefa>(`/stages/${stageId}/tasks`, data)
}

export async function updateTarefa(
  stageId: number,
  tarefaId: number,
  data: UpdateTarefaRequest
): Promise<Tarefa> {
  return api.patch<Tarefa>(`/stages/${stageId}/tasks/${tarefaId}`, data)
}

export async function deleteTarefa(stageId: number, tarefaId: number): Promise<void> {
  return api.delete<void>(`/stages/${stageId}/tasks/${tarefaId}`)
}
