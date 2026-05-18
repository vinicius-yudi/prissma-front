import { z } from "zod"

import { EtapaStatus } from "@/pages/projetos/types"

export const stageSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    description: z.string().optional(),
    displayOrder: z.number().int().positive("Ordem inválida"),
    status: z.enum([
      EtapaStatus.PLANNED,
      EtapaStatus.IN_PROGRESS,
      EtapaStatus.BLOCKED,
      EtapaStatus.DONE,
    ]),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
  })
  .refine(
    (d) => {
      if (!d.plannedStartDate || !d.plannedEndDate) return true
      return new Date(d.plannedEndDate) >= new Date(d.plannedStartDate)
    },
    { message: "Data final deve ser igual ou posterior à inicial", path: ["plannedEndDate"] },
  )

export type StageFormData = z.infer<typeof stageSchema>

export const STAGE_FORM_DEFAULTS: StageFormData = {
  name: "",
  description: "",
  displayOrder: 1,
  status: EtapaStatus.PLANNED,
  plannedStartDate: "",
  plannedEndDate: "",
}
