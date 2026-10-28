import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import { REPORT_PERIOD_DEFAULTS, reportPeriodSchema, type ReportPeriodFormData } from "../schemas/reportPeriod.schema"

export interface ReportPeriodForm {
  form: UseFormReturn<ReportPeriodFormData>
  handleSave: () => void
}

/** Período do relatório da obra. O erro do download vira toast no hook da mutation. */
export function useReportPeriodForm(onSubmit: (period: ReportPeriodFormData) => void): ReportPeriodForm {
  const form = useForm<ReportPeriodFormData>({
    resolver: zodResolver(reportPeriodSchema),
    defaultValues: REPORT_PERIOD_DEFAULTS,
  })
  return { form, handleSave: () => void form.handleSubmit(onSubmit)() }
}
