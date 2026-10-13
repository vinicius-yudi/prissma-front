import { z } from "zod"

import { TASK_PRIORITY, TASK_STATUS } from "../constants/kanban"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "obra.tarefas.validation.titleRequired"),
    description: z.string(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]),
    status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED, TASK_STATUS.DONE]),
    stageId: z.number("obra.tarefas.validation.stageRequired").int().positive("obra.tarefas.validation.stageRequired"),
    plannedStartDate: z.string().min(1, "obra.tarefas.validation.plannedStartDateRequired"),
    plannedEndDate: z.string().min(1, "obra.tarefas.validation.plannedEndDateRequired"),
    /** Opcional: o backend aceita tarefa sem responsável. */
    assigneeUserId: z.number().int().positive().nullable(),
  })
  .refine((d) => !d.plannedStartDate || !d.plannedEndDate || d.plannedEndDate >= d.plannedStartDate, {
    message: "obra.tarefas.validation.plannedEndDateBeforeStart",
    path: ["plannedEndDate"],
  })

export type TaskFormData = z.infer<typeof taskSchema>

/** Campos que o drawer salva sozinho ao sair do campo. */
export type AutosaveField = Exclude<keyof TaskFormData, "stageId" | "status">
