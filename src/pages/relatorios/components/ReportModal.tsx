import { FileText, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { useReportPeriodForm } from "../hooks/useReportPeriodForm"
import type { ReportPeriodFormData } from "../schemas/reportPeriod.schema"

interface ReportModalProps {
  open: boolean
  onClose: () => void
  isGenerating: boolean
  onGenerate: (period: ReportPeriodFormData) => void
}

/**
 * Relatório da obra em PDF (RF16): escolhe o período e baixa o arquivo que o
 * servidor gera. O período filtra a atividade (despesas, conclusões); os
 * totais da obra continuam absolutos.
 */
export function ReportModal({ open, onClose, isGenerating, onGenerate }: ReportModalProps) {
  const { t } = useTranslation()
  const { form, handleSave } = useReportPeriodForm(onGenerate)
  const { errors } = form.formState

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("relatorios.report.title")}
      description={t("relatorios.report.description")}
      icon={<FileText size={18} />}
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose} disabled={isGenerating}>
            {t("relatorios.report.cancel")}
          </Button>
          <Button fullWidth={false} onClick={handleSave} disabled={isGenerating}>
            {isGenerating && <Loader2 size={16} className="animate-spin" />}
            {t(isGenerating ? "relatorios.report.generating" : "relatorios.report.submit")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-4 px-6 pt-5 pb-6 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <Field label={t("relatorios.report.from")} hint={t("relatorios.report.fromHint")} error={errors.from?.message && t(errors.from.message)}>
          {(id) => <Input id={id} type="date" className="t-num" aria-invalid={!!errors.from} {...form.register("from")} />}
        </Field>
        <Field label={t("relatorios.report.to")} hint={t("relatorios.report.toHint")} error={errors.to?.message && t(errors.to.message)}>
          {(id) => <Input id={id} type="date" className="t-num" aria-invalid={!!errors.to} {...form.register("to")} />}
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
