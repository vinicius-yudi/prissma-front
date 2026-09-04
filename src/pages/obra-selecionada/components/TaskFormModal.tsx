import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Button } from "@/shared/components/ui/button/Button"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"
import { useTarefas } from "../hooks/useTarefas"
import { taskSchema } from "../schemas/tarefas.shcemas"
import type { CreateTarefaRequest, TarefaPriority, TarefaStatus, Tarefa } from "../types/tarefas"
import { useEffect } from "react"
import { useObraMembers } from "../hooks/useObraMembers"
import { isCollaboratorRole } from "@/shared/types/user"

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  stageId: number | null
  projectId: number
  canMutate?: boolean
  tarefaToEdit?: Tarefa | null
  onSaved?: () => void
}

export function TaskFormModal({ open, onClose, stageId, projectId, canMutate = true, tarefaToEdit, onSaved }: TaskFormModalProps) {
  const { t } = useTranslation()
  const form = useForm<CreateTarefaRequest>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM" as TarefaPriority,
      status: "TODO" as TarefaStatus,
      plannedStartDate: "",
      plannedEndDate: "",
      assigneeUserId: undefined,
    },
  })

  const { errors } = form.formState

  const { createAsync, isCreating, updateAsync } = useTarefas(stageId)

  const { list: members, isLoading: membersLoading } = useObraMembers(projectId, { enabled: open })

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (!open) {
      form.reset()
      return
    }

    if (tarefaToEdit) {
      form.reset({
        title: tarefaToEdit.title || "",
        description: tarefaToEdit.description || "",
        priority: tarefaToEdit.priority || ("MEDIUM" as TarefaPriority),
        status: tarefaToEdit.status || ("TODO" as TarefaStatus),
        plannedStartDate: tarefaToEdit.plannedStartDate || "",
        plannedEndDate: tarefaToEdit.plannedEndDate || "",
        assigneeUserId: tarefaToEdit.assigneeUserId ?? undefined,
      })
    }
  }, [open, tarefaToEdit])

  async function onSubmit(data: CreateTarefaRequest) {
    if (!stageId) return
    try {
      if (tarefaToEdit && tarefaToEdit.id) {
        await updateAsync({ id: tarefaToEdit.id, data })
      } else {
        await createAsync(data)
      }
      onSaved?.()
      onClose()
    } catch {
    }
  }

  const readOnly = !canMutate

  const title = t(tarefaToEdit ? "obra.tarefas.form.editTitle" : "obra.tarefas.form.createTitle")

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-6 pt-5 pb-2 grid grid-cols-1 gap-4">
          <div>
            <Label>{t("obra.tarefas.form.title")}</Label>
            <Input {...form.register("title")} disabled={readOnly} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div>
            <Label>{t("obra.tarefas.form.description")}</Label>
            <Textarea {...form.register("description")} disabled={readOnly} />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("obra.tarefas.form.status")}</Label>
              <Select {...form.register("status")} disabled={readOnly}>
                <option value="TODO">{t("obra.tarefas.columns.TODO")}</option>
                <option value="IN_PROGRESS">{t("obra.tarefas.columns.IN_PROGRESS")}</option>
                <option value="BLOCKED">{t("obra.tarefas.columns.BLOCKED")}</option>
                <option value="DONE">{t("obra.tarefas.columns.DONE")}</option>
              </Select>
              {errors.status && <p className="mt-1 text-xs text-danger">{errors.status.message}</p>}
            </div>
            <div>
              <Label>{t("obra.tarefas.form.priority")}</Label>
              <Select {...form.register("priority")} disabled={readOnly}>
                <option value="LOW">{t("obra.tarefas.priority.LOW")}</option>
                <option value="MEDIUM">{t("obra.tarefas.priority.MEDIUM")}</option>
                <option value="HIGH">{t("obra.tarefas.priority.HIGH")}</option>
              </Select>
              {errors.priority && <p className="mt-1 text-xs text-danger">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("obra.tarefas.form.startDate")}</Label>
              <Input type="date" min={today} {...form.register("plannedStartDate")} disabled={readOnly} />
              {errors.plannedStartDate && <p className="mt-1 text-xs text-danger">{errors.plannedStartDate.message}</p>}
            </div>
            <div>
              <Label>{t("obra.tarefas.form.endDate")}</Label>
              <Input type="date" min={today} {...form.register("plannedEndDate")} disabled={readOnly} />
              {errors.plannedEndDate && <p className="mt-1 text-xs text-danger">{errors.plannedEndDate.message}</p>}
            </div>
          </div>

          <div>
            <Label>{t("obra.tarefas.form.assignee")}</Label>
            <Select defaultValue="" {...form.register("assigneeUserId", { valueAsNumber: true })} disabled={membersLoading || readOnly}>
              <option value="" disabled>{t("obra.tarefas.form.assigneePlaceholder")}</option>
              {members
                .filter((m) => isCollaboratorRole(m.user.role))
                .map((m) => (
                  <option key={m.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
            </Select>
            {errors.assigneeUserId && <p className="mt-1 text-xs text-danger">{errors.assigneeUserId.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
            {t("obra.tarefas.cancel")}
          </Button>
          {canMutate && (
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t("obra.tarefas.form.saving") : t("obra.tarefas.form.save")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}