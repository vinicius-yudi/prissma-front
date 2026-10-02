import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Select } from "@/shared/components/ui/select/Select"

import type { UseProjectStepFormResult } from "../hooks/useProjectStepForm"

type ProjectDataStepProps = Pick<UseProjectStepFormResult, "form" | "isEdit">

/** Passo 1 — a obra: nome, tipo, categoria, áreas e janela planejada. */
export function ProjectDataStep({ form, isEdit }: ProjectDataStepProps) {
  const { t } = useTranslation()
  const { errors } = form.formState

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-6 pt-5 pb-2 md:grid-cols-2">
      <Field label={t("registerWork.name")} error={errorOf(errors.title?.message)} className="md:col-span-2">
        {(id) => (
          <Input
            id={id}
            placeholder={t("registerWork.namePlaceholder")}
            aria-invalid={!!errors.title}
            {...form.register("title")}
          />
        )}
      </Field>

      <Field label={t("registerWork.type")} error={errorOf(errors.projectType?.message)}>
        {(id) => (
          <Select id={id} aria-invalid={!!errors.projectType} {...form.register("projectType")}>
            <option value="" disabled>{t("registerWork.typePlaceholder")}</option>
            <option value="RESIDENTIAL">{t("registerWork.typeResidential")}</option>
            <option value="COMMERCIAL">{t("registerWork.typeCommercial")}</option>
            <option value="INDUSTRIAL">{t("registerWork.typeIndustrial")}</option>
          </Select>
        )}
      </Field>

      <Field label={t("registerWork.category")} error={errorOf(errors.category?.message)}>
        {(id) => (
          <Select id={id} aria-invalid={!!errors.category} {...form.register("category")}>
            <option value="" disabled>{t("registerWork.categoryPlaceholder")}</option>
            <option value="BUILDING">{t("registerWork.categoryBuilding")}</option>
            <option value="RENOVATION">{t("registerWork.categoryRenovation")}</option>
          </Select>
        )}
      </Field>

      {isEdit && (
        <Field label={t("projects.editModal.status")} className="md:col-span-2">
          {(id) => (
            <Select id={id} {...form.register("status")}>
              <option value="PLANNING">{t("projects.status.planning")}</option>
              <option value="IN_PROGRESS">{t("projects.status.inProgress")}</option>
              <option value="PAUSED">{t("projects.status.paused")}</option>
              <option value="COMPLETED">{t("projects.status.completed")}</option>
              <option value="CANCELLED">{t("projects.status.cancelled")}</option>
            </Select>
          )}
        </Field>
      )}

      <Field label={t("registerWork.landArea")} error={errorOf(errors.landArea?.message)}>
        {(id) => (
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            suffix={<span className="t-num text-[13px]">m²</span>}
            className="t-num"
            aria-invalid={!!errors.landArea}
            {...form.register("landArea", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label={t("registerWork.builtArea")} error={errorOf(errors.builtArea?.message)}>
        {(id) => (
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            suffix={<span className="t-num text-[13px]">m²</span>}
            className="t-num"
            aria-invalid={!!errors.builtArea}
            {...form.register("builtArea", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label={t("registerWork.startDate")} error={errorOf(errors.plannedStartDate?.message)}>
        {(id) => (
          <Input id={id} type="date" className="t-num" aria-invalid={!!errors.plannedStartDate} {...form.register("plannedStartDate")} />
        )}
      </Field>

      <Field label={t("registerWork.endDate")} error={errorOf(errors.plannedEndDate?.message)}>
        {(id) => (
          <Input id={id} type="date" className="t-num" aria-invalid={!!errors.plannedEndDate} {...form.register("plannedEndDate")} />
        )}
      </Field>
    </div>
  )
}
