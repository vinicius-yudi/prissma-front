import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { Proposal } from "../../types/proposal"

interface DeletePropostaModalProps {
  proposal: Proposal | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão da proposta com todas as versões. */
export function DeletePropostaModal({ proposal, isDeleting, onCancel, onConfirm }: DeletePropostaModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={proposal !== null}
      onClose={onCancel}
      title={t("obra.propostas.deleteModal.title")}
      description={t("obra.propostas.deleteModal.message", { title: proposal?.title ?? "" })}
      icon={<AlertTriangle size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isDeleting}>
            {t("obra.propostas.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? t("obra.propostas.deleteModal.deleting") : t("obra.propostas.deleteModal.confirm")}
          </Button>
        </>
      }
    />
  )
}
