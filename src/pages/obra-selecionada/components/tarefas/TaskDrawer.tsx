import { Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Drawer } from "@/shared/components/ui/drawer/Drawer"
import { IconButton } from "@/shared/components/ui/icon-button/IconButton"

import { TaskForm, type TaskFormProps } from "./TaskForm"

interface TaskDrawerProps extends Omit<TaskFormProps, "onClose"> {
  open: boolean
  onClose: () => void
  onDelete: () => void
}

/**
 * Detalhe da tarefa em painel lateral (redesign): abrir o card não tira o
 * quadro de vista. Serve também para criar, com um botão no rodapé.
 */
export function TaskDrawer({ open, onClose, onDelete, ...form }: TaskDrawerProps) {
  const { t } = useTranslation()
  const isEdit = form.item !== null

  return (
    <Drawer open={open} onClose={onClose} label={isEdit ? t("obra.tarefas.form.editTitle") : t("obra.tarefas.form.createTitle")} width={500}>
      <div className="flex flex-none items-center justify-between gap-3 border-b border-border py-3 pr-3 pl-5">
        <p className="min-w-0 truncate text-[13px] text-meta">
          {isEdit ? form.item?.stageName : t("obra.tarefas.form.createTitle")}
        </p>
        <div className="flex items-center gap-1">
          {isEdit && form.canMutate && (
            <IconButton label={t("obra.tarefas.actions.delete")} onClick={onDelete} className="hover:bg-danger-soft hover:text-danger">
              <Trash2 size={16} />
            </IconButton>
          )}
          <IconButton label={t("common.close")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
      </div>
      <TaskForm key={form.item?.tarefa.id ?? "new"} {...form} onClose={onClose} />
    </Drawer>
  )
}
