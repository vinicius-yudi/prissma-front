import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { TarefaComEtapa } from "../../types/tarefas"

interface DeleteTaskModalProps {
  item: TarefaComEtapa | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão de tarefa. */
export function DeleteTaskModal({ item, isDeleting, onCancel, onConfirm }: DeleteTaskModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={!!item}
      onClose={onCancel}
      title={t("obra.tarefas.deleteTitle")}
      description={t("obra.tarefas.deleteDescription", { title: item?.tarefa.title ?? "" })}
      icon={<Trash2 size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isDeleting}>
            {t("obra.tarefas.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isDeleting}>
            {t("obra.tarefas.confirmDelete")}
          </Button>
        </>
      }
    />
  )
}
