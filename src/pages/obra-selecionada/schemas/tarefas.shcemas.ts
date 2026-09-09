import { t } from "i18next"
import { z } from "zod"

export const taskSchema = z.object({
    title: z.string().min(1, {
        message: t("obra.tarefas.validation.titleRequired", "Título é obrigatório")
    }),
    description: z.string().min(1, {
        message: t("obra.tarefas.validation.descriptionRequired", "Descrição é obrigatória")
    }),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
        message: t("obra.tarefas.validation.priorityRequired", "Selecionar o nível de prioridade é obrigatório")
    }),
    status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'], {
        message: t("obra.tarefas.validation.statusRequired", "Selecionar o status é obrigatório")
    }),
    plannedStartDate: z.string()
        .min(1, { message: t("obra.tarefas.validation.plannedStartDateRequired", "Data de início planejada é obrigatória") }),
    plannedEndDate: z.string()
        .min(1, { message: t("obra.tarefas.validation.plannedEndDateRequired", "Data de término planejada é obrigatória") }),
    assigneeUserId: z.number({
        message: t("obra.tarefas.validation.assigneeRequired", "Selecionar o funcionário responsável é obrigatório")
    }).positive({
        message: t("obra.tarefas.validation.assigneeRequired", "Selecionar o funcionário responsável é obrigatório")
    }),
}).refine((data) => data.plannedEndDate >= data.plannedStartDate, {
    message: t("obra.tarefas.validation.plannedEndDateBeforeStart", "Data de término não pode ser antes da data de início"),
    path: ["plannedEndDate"],
})