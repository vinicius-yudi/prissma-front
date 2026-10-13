import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

import { useTaskForm } from "../../hooks/useTaskForm"
import type { useTaskActions } from "../../hooks/useTaskActions"
import type { Stage } from "../../services/stages.service"
import type { TarefaComEtapa } from "../../types/tarefas"
import { TaskFormFields, type AssigneeOption } from "./TaskFormFields"

export interface TaskFormProps {
  item: TarefaComEtapa | null
  stages: Stage[]
  defaultStage: Stage | null
  assignees: AssigneeOption[]
  actions: ReturnType<typeof useTaskActions>
  canMutate: boolean
  onClose: () => void
}

/**
 * Corpo do drawer. Só existe montado com o drawer aberto, e é aí que o
 * formulário lê os valores iniciais.
 */
export function TaskForm({ item, stages, defaultStage, assignees, actions, canMutate, onClose }: TaskFormProps) {
  const { t } = useTranslation()
  const state = useTaskForm({ item, stages, defaultStage, actions, onCreated: onClose })

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!state.isEdit) state.handleCreate()
      }}
    >
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <TaskFormFields state={state} stages={stages} assignees={assignees} readOnly={!canMutate} />
      </div>
      {!state.isEdit && canMutate && (
        <footer className="flex flex-none justify-end gap-2 border-t border-border bg-raised/60 px-5 py-4">
          <Button type="button" variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.tarefas.cancel")}
          </Button>
          <Button type="submit" fullWidth={false} disabled={actions.isCreating}>
            {actions.isCreating && <Loader2 size={16} className="animate-spin" />}
            {t("obra.tarefas.form.create")}
          </Button>
        </footer>
      )}
    </form>
  )
}
