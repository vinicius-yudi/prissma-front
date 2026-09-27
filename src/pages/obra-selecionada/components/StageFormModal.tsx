import { Layers, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { useStageForm } from "../hooks/useStageForm"
import { useStages } from "../hooks/useStages"
import type { Stage } from "../services/stages.service"
import { DeleteStageModal } from "./etapas/DeleteStageModal"
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { removeAsync, isDeleting } = useStages(projectId)
  const { form, handleSave, isSaving } = useStageForm({
    projectId,
    projectStartDate,
    stages,
    stage,
    suggestedDisplayOrder,
    onSaved: onClose,
  })
  const busy = isSaving || isDeleting

  async function handleConfirmDelete() {
    if (!stage) return
    try {
      await removeAsync(stage.id)
      setConfirmDelete(false)
      onClose()
    } catch {
      // O toast de erro sai do hook; a confirmação fica aberta.
    }
  }

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      <div>
        {stage && canMutate && (
          <Button type="button" variant="ghost" fullWidth={false} onClick={() => setConfirmDelete(true)} disabled={busy} className="text-danger hover:bg-danger-soft hover:text-danger">
            <Trash2 size={14} />
            {t("obra.etapas.actions.delete")}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" fullWidth={false} onClick={onClose} disabled={busy}>
          {t("obra.etapas.actions.cancel")}
        </Button>
        {canMutate && (
          <Button type="button" fullWidth={false} onClick={handleSave} disabled={busy}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? t("obra.etapas.actions.saving") : t("obra.etapas.actions.save")}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Modal
        open={open && !confirmDelete}
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

      <DeleteStageModal
        stage={open && confirmDelete ? stage : null}
        isDeleting={isDeleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
