import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Layers, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import { EtapaStatus } from "@/pages/projetos/types"
import { getFirstFormErrorMessage } from "@/shared/utils/formValidation"

import { useStages } from "../hooks/useStages"
import {
  STAGE_FORM_DEFAULTS,
  stageSchema,
  type StageFormData,
} from "../schemas/stageSchema"
import type { Stage } from "../services/stages.service"

const formLabel = tv({
  base: "block text-xs uppercase tracking-widest text-primary font-semibold",
})

const formInput = tv({
  base: "bg-surface-container-highest text-on-surface [&_option]:bg-surface-container-highest focus:ring-1",
})

interface StageFormModalProps {
  open: boolean
  onClose: () => void
  projectId: number
  projectStartDate: string | null
  stages: Stage[]
  stage?: Stage | null
  suggestedDisplayOrder?: number
  canMutate: boolean
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return ""
  return value.length >= 10 ? value.slice(0, 10) : value
}

export function StageFormModal({
  open,
  onClose,
  projectId,
  projectStartDate,
  stages,
  stage,
  suggestedDisplayOrder = 1,
  canMutate,
}: StageFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!stage
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { createAsync, updateAsync, removeAsync, isCreating, isUpdating, isDeleting } =
    useStages(projectId)
  const isLoading = isCreating || isUpdating || isDeleting

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: STAGE_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    if (stage) {
      form.reset({
        name: stage.name,
        description: stage.description ?? "",
        displayOrder: stage.displayOrder,
        status: stage.status,
        plannedStartDate: toDateInput(stage.plannedStartDate),
        plannedEndDate: toDateInput(stage.plannedEndDate),
      })
    } else {
      form.reset({
        ...STAGE_FORM_DEFAULTS,
        displayOrder: suggestedDisplayOrder,
      })
    }
  }, [open, stage, suggestedDisplayOrder, form])

  async function onSubmit(data: StageFormData) {
    const plannedStartDate = data.plannedStartDate?.trim() || null

    if (plannedStartDate && projectStartDate && plannedStartDate < toDateInput(projectStartDate)) {
      toast.error(t("obra.etapas.toasts.startBeforeProject"))
      return
    }

    if (plannedStartDate) {
      const previousStage = stages
        .filter((item) => item.id !== stage?.id && item.displayOrder < data.displayOrder)
        .sort((a, b) => b.displayOrder - a.displayOrder)[0]

      if (previousStage && !previousStage.plannedStartDate) {
        toast.error(t("obra.etapas.toasts.previousStartRequired"))
        return
      }

      if (
        previousStage?.plannedStartDate &&
        plannedStartDate < toDateInput(previousStage.plannedStartDate)
      ) {
        toast.error(t("obra.etapas.toasts.startBeforePrevious"))
        return
      }
    }

    const payload = {
      name: data.name,
      description: data.description?.trim() ? data.description.trim() : null,
      displayOrder: data.displayOrder,
      status: data.status,
      plannedStartDate,
      plannedEndDate: data.plannedEndDate?.trim() ? data.plannedEndDate : null,
    }

    try {
      if (isEdit && stage) {
        await updateAsync({ id: stage.id, payload })
      } else {
        await createAsync(payload)
      }
      onClose()
    } catch {
      // toast already handled in the hook
    }
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const message = getFirstFormErrorMessage(errors)
    if (message) toast.error(message)
  }

  async function handleConfirmDelete() {
    if (!stage) return
    try {
      await removeAsync(stage.id)
      setConfirmDelete(false)
      onClose()
    } catch {
      // toast already handled in the hook
    }
  }

  const readOnly = !canMutate

  return (
    <>
      <Modal
        open={open && !confirmDelete}
        onClose={onClose}
        title={
          isEdit ? t("obra.etapas.form.title.edit") : t("obra.etapas.form.title.create")
        }
        icon={<Layers size={18} />}
        variant="default"
        size="lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
          <div className="px-6 pt-5 pb-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <Label className={formLabel()}>{t("obra.etapas.form.fields.name")}</Label>
              <Input
                className={formInput()}
                placeholder={t("obra.etapas.form.fields.namePlaceholder")}
                disabled={readOnly}
                {...form.register("name")}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className={formLabel()}>
                {t("obra.etapas.form.fields.description")}
              </Label>
              <textarea
                rows={3}
                className="w-full rounded-xl px-4 py-3 bg-surface-container-highest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder={t("obra.etapas.form.fields.descriptionPlaceholder")}
                disabled={readOnly}
                {...form.register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("obra.etapas.form.fields.status")}</Label>
              <Select
                className={formInput()}
                disabled={readOnly}
                {...form.register("status")}
              >
                <option value={EtapaStatus.PLANNED}>
                  {t("obra.etapas.etapaStatus.PLANNED")}
                </option>
                <option value={EtapaStatus.IN_PROGRESS}>
                  {t("obra.etapas.etapaStatus.IN_PROGRESS")}
                </option>
                <option value={EtapaStatus.BLOCKED}>
                  {t("obra.etapas.etapaStatus.BLOCKED")}
                </option>
                <option value={EtapaStatus.DONE}>
                  {t("obra.etapas.etapaStatus.DONE")}
                </option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>
                {t("obra.etapas.form.fields.displayOrder")}
              </Label>
              <Input
                className={formInput()}
                type="number"
                min={1}
                disabled={readOnly}
                {...form.register("displayOrder", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>
                {t("obra.etapas.form.fields.plannedStartDate")}
              </Label>
              <Input
                className={formInput()}
                type="date"
                disabled={readOnly}
                {...form.register("plannedStartDate")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>
                {t("obra.etapas.form.fields.plannedEndDate")}
              </Label>
              <Input
                className={formInput()}
                type="date"
                disabled={readOnly}
                {...form.register("plannedEndDate")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
            <div>
              {isEdit && canMutate && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-error/40 text-error hover:bg-error/10 hover:border-error w-auto px-4"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isLoading}
                >
                  <Trash2 size={14} />
                  {t("obra.etapas.actions.delete")}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-auto px-4"
              >
                {t("obra.etapas.actions.cancel")}
              </Button>
              {canMutate && (
                <Button type="submit" disabled={isLoading} className="w-auto px-4">
                  {isLoading
                    ? t("obra.etapas.actions.saving")
                    : t("obra.etapas.actions.save")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("obra.etapas.deleteModal.title")}
        icon={<AlertTriangle size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("obra.etapas.deleteModal.message", { name: stage?.name ?? "" })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              {t("obra.etapas.actions.cancel")}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-error text-on-error border-0 hover:brightness-[0.92]"
            >
              {isDeleting
                ? t("obra.etapas.deleteModal.deleting")
                : t("obra.etapas.deleteModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
