import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"
import { daysLate, startOfLocalDay, startOfToday } from "@/shared/utils/status"

import type { MyTask } from "../services/myTasks.service"

const MS_PER_DAY = 86_400_000
const DONE = "DONE"
const BLOCKED = "BLOCKED"
const HIGH = "HIGH"
const WEEK = 7

export interface Alert {
  key: string
  kind: "task" | "blocked" | "project"
  title: string
  projectTitle: string
  daysLate: number
  to: string
  /** Ordem por gravidade: bloqueada + dias de atraso primeiro. */
  weight: number
}

export interface WeekDay {
  offset: number
  date: Date
  tasks: (MyTask & { projectTitle: string; urgent: boolean })[]
}

function isOpenProject(project: Project | undefined): boolean {
  return !!project && project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.CANCELLED
}

function dayOffset(date: string | null): number | null {
  const day = startOfLocalDay(date)
  if (!day) return null
  return Math.round((day.getTime() - startOfToday().getTime()) / MS_PER_DAY)
}

/**
 * "Precisa da sua atenção": minhas tarefas vencidas (bloqueadas primeiro) e
 * obras que passaram do prazo. Cada item leva à aba onde se resolve.
 */
export function buildAlerts(tasks: MyTask[], projects: Project[]): Alert[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const alerts: Alert[] = []

  for (const task of tasks) {
    const project = byId.get(task.projectId)
    const late = daysLate(task.plannedEndDate)
    if (task.status === DONE || late === 0 || !project || !isOpenProject(project)) continue
    const blocked = task.status === BLOCKED
    alerts.push({
      key: `task-${task.id}`,
      kind: blocked ? "blocked" : "task",
      title: task.title,
      projectTitle: project.title,
      daysLate: late,
      to: `/obras/${project.id}/tarefas`,
      weight: late + (blocked ? 10 : 0),
    })
  }

  for (const project of projects) {
    const late = daysLate(project.plannedEndDate)
    if (!isOpenProject(project) || late === 0) continue
    alerts.push({
      key: `project-${project.id}`,
      kind: "project",
      title: project.title,
      projectTitle: project.title,
      daysLate: late,
      to: `/obras/${project.id}/visao-geral`,
      // Abaixo de tarefa bloqueada (DS v2, Alerta), acima de atraso simples.
      weight: late + 5,
    })
  }

  return alerts.sort((a, b) => b.weight - a.weight)
}

/** Minhas tarefas abertas que vencem em cada um dos próximos 7 dias. */
export function buildWeek(tasks: MyTask[], projects: Project[]): WeekDay[] {
  const titles = new Map(projects.map((p) => [p.id, p.title]))
  const today = startOfToday()

  return Array.from({ length: WEEK }, (_, offset) => ({
    offset,
    date: new Date(today.getTime() + offset * MS_PER_DAY),
    tasks: tasks
      .filter((task) => task.status !== DONE && dayOffset(task.plannedEndDate) === offset)
      .map((task) => ({ ...task, projectTitle: titles.get(task.projectId) ?? "", urgent: task.priority === HIGH })),
  }))
}

export function openTasks(tasks: MyTask[]): MyTask[] {
  return tasks.filter((task) => task.status !== DONE)
}
