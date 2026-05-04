import { UserCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/shared/components/ui/modal/Modal"

import { PerfilForm } from "./PerfilForm"

interface PerfilModalProps {
  open: boolean
  onClose: () => void
  onDeleteAccount: () => void
}

export function PerfilModal({ open, onClose, onDeleteAccount }: PerfilModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("profile.title")}
      description={t("profile.subtitle")}
      icon={<UserCircle size={18} />}
      variant="default"
      size="lg"
    >
      <div className="px-6 py-5">
        <PerfilForm open={open} onClose={onClose} onDeleteAccount={onDeleteAccount} />
      </div>
    </Modal>
  )
}
