import { Layers, Loader2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { useStageForm } from "../hooks/useStageForm"
import { useStages } from "../hooks/useStages"
import type { Stage } from "../services/stages.service"
import { StageFormFields } from "./etapas/StageFormFields"

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

/**
 * Criar ou editar etapa. Os valores iniciais são lidos no mount — quem abre
 * troca a `key` a cada abertura. Excluir troca o formulário pela confirmação
 * no mesmo lugar, e cancelar volta a ele.
 */
export function StageFormModal({
  open,
  onClose,
  projectId,
  projectStartDate,
  stages,
  stage = null,
  suggestedDisplayOrder = 1,
  canMutate,
}: StageFormModalProps) {
  const { t } = useTranslation()
  const { remove } = useStages(projectId)
  const { form, handleSave, isSaving } = useStageForm({
    projectId,
    projectStartDate,
    stages,
    stage,
    suggestedDisplayOrder,
    onSaved: onClose,
  })

  // Excluir fecha o formulário e sai com Desfazer no toast — sem confirmação.
  function handleDelete() {
    if (!stage) return
    onClose()
    remove(stage)
  }

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      <div>
        {stage && canMutate && (
          <Button type="button" variant="ghost" fullWidth={false} onClick={handleDelete} disabled={isSaving} className="text-danger hover:bg-danger-soft hover:text-danger">
            <Trash2 size={14} />
            {t("obra.etapas.actions.delete")}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" fullWidth={false} onClick={onClose} disabled={isSaving}>
          {t("obra.etapas.actions.cancel")}
        </Button>
        {canMutate && (
          <Button type="button" fullWidth={false} onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? t("obra.etapas.actions.saving") : t("obra.etapas.actions.save")}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={stage ? t("obra.etapas.form.title.edit") : t("obra.etapas.form.title.create")}
      icon={<Layers size={18} />}
      size="lg"
      footer={footer}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <StageFormFields form={form} readOnly={!canMutate} />
        {/* Enter num campo envia o formulário, como o usuário espera. */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
