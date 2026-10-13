import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"

import { STAGE_SECTIONS } from "../../constants/stageSections"
import type { StageFormData } from "../../schemas/stageSchema"

interface StageFormFieldsProps {
  form: UseFormReturn<StageFormData>
  readOnly: boolean
}

/** Campos da etapa: nome, descrição, status, ordem e a janela planejada. */
export function StageFormFields({ form, readOnly }: StageFormFieldsProps) {
  const { t } = useTranslation()
  const { errors } = form.formState

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <fieldset disabled={readOnly} className="grid grid-cols-1 gap-4 px-6 pt-5 pb-6 md:grid-cols-2">
      <Field label={t("obra.etapas.form.fields.name")} error={errorOf(errors.name?.message)} className="md:col-span-2">
        {(id) => (
          <Input
            id={id}
            placeholder={t("obra.etapas.form.fields.namePlaceholder")}
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
        )}
      </Field>

      <Field label={t("obra.etapas.form.fields.description")} className="md:col-span-2">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            placeholder={t("obra.etapas.form.fields.descriptionPlaceholder")}
            {...form.register("description")}
          />
        )}
      </Field>

      <Field label={t("obra.etapas.form.fields.status")}>
        {(id) => (
          <Select id={id} {...form.register("status")}>
            {STAGE_SECTIONS.map((status) => (
              <option key={status} value={status}>
                {t(`obra.etapas.etapaStatus.${status}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label={t("obra.etapas.form.fields.displayOrder")}
        hint={t("obra.etapas.form.orderHint")}
        error={errorOf(errors.displayOrder?.message)}
      >
        {(id) => (
          <Input
            id={id}
            type="number"
            min={1}
            aria-invalid={!!errors.displayOrder}
            {...form.register("displayOrder", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label={t("obra.etapas.form.fields.plannedStartDate")} error={errorOf(errors.plannedStartDate?.message)}>
        {(id) => (
          <Input id={id} type="date" aria-invalid={!!errors.plannedStartDate} {...form.register("plannedStartDate")} />
        )}
      </Field>

      <Field label={t("obra.etapas.form.fields.plannedEndDate")} error={errorOf(errors.plannedEndDate?.message)}>
        {(id) => (
          <Input id={id} type="date" aria-invalid={!!errors.plannedEndDate} {...form.register("plannedEndDate")} />
        )}
      </Field>
    </fieldset>
  )
}
