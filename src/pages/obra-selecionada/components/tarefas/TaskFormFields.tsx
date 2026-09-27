import { AlertTriangle } from "lucide-react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"
import { daysLate } from "@/shared/utils/status"

import { PRIORITIES, TASK_STATUS } from "../../constants/kanban"
import type { UseTaskFormResult } from "../../hooks/useTaskForm"
import type { Stage } from "../../services/stages.service"
import { TaskStatusPicker } from "./TaskStatusPicker"

export interface AssigneeOption {
  id: number
  name: string
}

interface TaskFormFieldsProps {
  state: UseTaskFormResult
  stages: Stage[]
  assignees: AssigneeOption[]
  readOnly: boolean
}

function toAssignee(value: string): number | null {
  return value === "" ? null : Number(value)
}

/** Campos do drawer. Em edição cada um grava ao sair; ao criar, só coleta. */
export function TaskFormFields({ state, stages, assignees, readOnly }: TaskFormFieldsProps) {
  const { t } = useTranslation()
  const { form, isEdit, stageStart, saveField, changeStatus } = state
  const { errors } = form.formState
  const [status, end, assignee] = useWatch({ control: form.control, name: ["status", "plannedEndDate", "assigneeUserId"] })
  const late = isEdit && status !== TASK_STATUS.DONE ? daysLate(end) : 0

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <fieldset disabled={readOnly} className="min-w-0">
      <Field label={t("obra.tarefas.form.title")} error={errorOf(errors.title?.message)}>
        {(id) => (
          <Textarea
            id={id}
            rows={2}
            placeholder={t("obra.tarefas.quickAdd.placeholder")}
            aria-invalid={!!errors.title}
            className="t-title-sm resize-none"
            {...form.register("title", { onBlur: () => saveField("title") })}
          />
        )}
      </Field>

      {late > 0 && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-[11px] bg-danger-soft px-3 py-2.5 text-[13px] font-[580] text-danger">
          <AlertTriangle size={15} className="mt-px flex-none" />
          {t("obra.tarefas.lateBanner", { count: late })}
        </div>
      )}

      <p className="t-label mt-6 mb-2 text-ink-2">{t("obra.tarefas.form.status")}</p>
      <TaskStatusPicker value={status} disabled={readOnly} onChange={changeStatus} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Field label={t("obra.tarefas.form.assignee")}>
          {(id) => (
            <Select id={id} {...form.register("assigneeUserId", { setValueAs: toAssignee, onChange: () => saveField("assigneeUserId") })}>
              {/* O PATCH não remove responsável: "sem" só existe enquanto não há um. */}
              {(!isEdit || assignee === null) && <option value="">{t("obra.tarefas.unassigned")}</option>}
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.tarefas.form.priority")}>
          {(id) => (
            <Select id={id} {...form.register("priority", { onChange: () => saveField("priority") })}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`obra.tarefas.priority.${priority}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.tarefas.form.startDate")} error={errorOf(errors.plannedStartDate?.message)}>
          {(id) => (
            <Input id={id} type="date" min={stageStart} aria-invalid={!!errors.plannedStartDate} {...form.register("plannedStartDate", { onBlur: () => saveField("plannedStartDate") })} />
          )}
        </Field>
        <Field label={t("obra.tarefas.form.endDate")} error={errorOf(errors.plannedEndDate?.message)}>
          {(id) => (
            <Input id={id} type="date" aria-invalid={!!errors.plannedEndDate || late > 0} {...form.register("plannedEndDate", { onBlur: () => saveField("plannedEndDate") })} />
          )}
        </Field>
        {!isEdit && (
          <Field label={t("obra.tarefas.form.stage")} error={errorOf(errors.stageId?.message)} className="col-span-2">
            {(id) => (
              <Select id={id} aria-invalid={!!errors.stageId} {...form.register("stageId", { valueAsNumber: true })}>
                {stages.map((stage, index) => (
                  <option key={stage.id} value={stage.id}>
                    {String(index + 1).padStart(2, "0")} · {stage.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>

      <Field label={t("obra.tarefas.form.description")} className="mt-4">
        {(id) => (
          <Textarea
            id={id}
            rows={4}
            placeholder={t("obra.tarefas.form.descriptionPlaceholder")}
            {...form.register("description", { onBlur: () => saveField("description") })}
          />
        )}
      </Field>

      {isEdit && !readOnly && <p className="mt-6 text-[12px] text-meta">{t("obra.tarefas.autosave")}</p>}
    </fieldset>
  )
}
