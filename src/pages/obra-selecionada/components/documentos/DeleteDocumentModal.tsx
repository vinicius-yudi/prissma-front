import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { Attachment } from "@/shared/types/attachment"

interface DeleteDocumentModalProps {
  attachment: Attachment | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão de arquivo — o backend apaga o binário também. */
export function DeleteDocumentModal({ attachment, isDeleting, onCancel, onConfirm }: DeleteDocumentModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={attachment !== null}
      onClose={onCancel}
      title={t("obra.documentos.deleteModal.title")}
      description={t("obra.documentos.deleteModal.message", { name: attachment?.fileName ?? "" })}
      icon={<AlertTriangle size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isDeleting}>
            {t("obra.documentos.deleteModal.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isDeleting}>
            {t("obra.documentos.deleteModal.confirm")}
          </Button>
        </>
      }
    />
  )
}
