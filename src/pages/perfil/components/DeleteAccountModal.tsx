import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { useDeleteAccount } from "../hooks/useDeleteAccount"

interface DeleteAccountModalProps {
  open: boolean
  onClose: () => void
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation()
  const { handleDelete, isLoading } = useDeleteAccount({ onSuccess: onClose })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("profile.deleteModal.title")}
      icon={<AlertTriangle size={20} />}
      variant="danger"
      size="sm"
    >
      <div className="px-6 pb-6 space-y-5">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t("profile.deleteModal.message")}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("profile.deleteModal.cancel")}
          </Button>
          <Button
            onClick={() => handleDelete()}
            disabled={isLoading}
            className="bg-error text-on-error border-0 hover:brightness-[0.92]"
          >
            {isLoading ? t("profile.deleteModal.deleting") : t("profile.deleteModal.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
