import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { WorkspaceMember } from "@/shared/types/workspace"

interface RemoveMemberModalProps {
  member: WorkspaceMember | null
  isRemoving: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Confirmação de remoção da conta. Remover tira a pessoa de todas as obras da
 * conta e não volta com um Desfazer — por isso ainda é modal.
 */
export function RemoveMemberModal({ member, isRemoving, onCancel, onConfirm }: RemoveMemberModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={!!member}
      onClose={onCancel}
      title={t("workspace.team.remove")}
      description={t("workspace.team.removeConfirm", { name: member?.name ?? member?.email ?? "" })}
      icon={<X size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel}>
            {t("obra.equipes.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isRemoving}>
            {t("workspace.team.remove")}
          </Button>
        </>
      }
    />
  )
}
