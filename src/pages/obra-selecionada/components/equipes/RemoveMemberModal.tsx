import { UserMinus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { ConstructionProjectMember } from "../../types/equipes"

interface RemoveMemberModalProps {
  member: ConstructionProjectMember | null
  isRemoving: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de tirar alguém da obra. */
export function RemoveMemberModal({ member, isRemoving, onCancel, onConfirm }: RemoveMemberModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={member !== null}
      onClose={onCancel}
      title={t("obra.equipes.removeModal.title")}
      description={t("obra.equipes.removeModal.message", { name: member?.user.name ?? "" })}
      icon={<UserMinus size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isRemoving}>
            {t("obra.equipes.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isRemoving}>
            {isRemoving ? t("obra.equipes.removeModal.removing") : t("obra.equipes.removeModal.confirm")}
          </Button>
        </>
      }
    />
  )
}
