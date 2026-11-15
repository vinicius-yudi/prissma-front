import { z } from "zod"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
const E = "relatorios.report.validation"

/** Data opcional: vazio deixa o backend escolher o limite do período. */
const optionalDate = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, `${E}.dateInvalid`)

export const reportPeriodSchema = z
  .object({ from: optionalDate, to: optionalDate })
  // Data ISO compara como texto. O backend responde 400 no mesmo caso.
  .refine((period) => !period.from || !period.to || period.from <= period.to, {
    message: `${E}.rangeInvalid`,
    path: ["to"],
  })

export type ReportPeriodFormData = z.infer<typeof reportPeriodSchema>

export const REPORT_PERIOD_DEFAULTS: ReportPeriodFormData = { from: "", to: "" }
