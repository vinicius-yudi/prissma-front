import { z } from "zod"

import { EtapaStatus } from "@/pages/projetos/types"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
export const stageSchema = z
  .object({
    name: z.string().trim().min(1, "obra.etapas.form.errors.nameRequired"),
    description: z.string().optional(),
    displayOrder: z.number("obra.etapas.form.errors.orderInvalid").int().positive("obra.etapas.form.errors.orderInvalid"),
    status: z.enum([
      EtapaStatus.PLANNED,
      EtapaStatus.IN_PROGRESS,
      EtapaStatus.BLOCKED,
      EtapaStatus.DONE,
    ]),
    plannedStartDate: z.string().min(1, "obra.etapas.form.errors.startRequired"),
    plannedEndDate: z.string().min(1, "obra.etapas.form.errors.endRequired"),
  })
  .refine((d) => new Date(d.plannedEndDate) >= new Date(d.plannedStartDate), {
    message: "obra.etapas.form.errors.endBeforeStart",
    path: ["plannedEndDate"],
  })

export type StageFormData = z.infer<typeof stageSchema>

export const STAGE_FORM_DEFAULTS: StageFormData = {
  name: "",
  description: "",
  displayOrder: 1,
  status: EtapaStatus.PLANNED,
  plannedStartDate: "",
  plannedEndDate: "",
}
