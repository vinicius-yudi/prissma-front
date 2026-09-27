import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { DiarioEntry } from "../../types/diario"

interface DeleteDiaryModalProps {
  entry: DiarioEntry | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão de registro do diário. */
export function DeleteDiaryModal({ entry, isDeleting, onCancel, onConfirm }: DeleteDiaryModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={entry !== null}
      onClose={onCancel}
      title={t("obra.diario.deleteModal.title")}
      description={t("obra.diario.deleteModal.message")}
      icon={<AlertTriangle size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isDeleting}>
            {t("obra.diario.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? t("obra.diario.deleteModal.deleting") : t("obra.diario.deleteModal.confirm")}
          </Button>
        </>
      }
    />
  )
}
