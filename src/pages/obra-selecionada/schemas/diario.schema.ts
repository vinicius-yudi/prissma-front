import { z } from "zod"

import { DIARY_TYPE } from "../constants/diario"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
export const diarioSchema = z.object({
  entryType: z.enum([DIARY_TYPE.OCCURRENCE, DIARY_TYPE.DELIVERY, DIARY_TYPE.WORKFORCE, DIARY_TYPE.IMPEDIMENT]),
  description: z.string().trim().min(1, "obra.diario.validation.descriptionRequired"),
  /** `datetime-local` (hora local, sem fuso). */
  entryDate: z.string().min(1, "obra.diario.validation.dateRequired"),
})

export type DiarioFormData = z.infer<typeof diarioSchema>
