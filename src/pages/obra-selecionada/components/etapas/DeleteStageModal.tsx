import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { Stage } from "../../services/stages.service"

interface DeleteStageModalProps {
  stage: Stage | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão de etapa — apaga também as tarefas dela. */
export function DeleteStageModal({ stage, isDeleting, onCancel, onConfirm }: DeleteStageModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={!!stage}
      onClose={onCancel}
      title={t("obra.etapas.deleteModal.title")}
      description={t("obra.etapas.deleteModal.message", { name: stage?.name ?? "" })}
      icon={<AlertTriangle size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isDeleting}>
            {t("obra.etapas.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? t("obra.etapas.deleteModal.deleting") : t("obra.etapas.deleteModal.confirm")}
          </Button>
        </>
      }
    />
  )
}
