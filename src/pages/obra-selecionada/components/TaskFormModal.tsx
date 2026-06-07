import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Button } from "@/shared/components/ui/button/Button"
import { Select } from "@/shared/components/ui/select/Select"
import { useTarefas } from "../hooks/useTarefas"
import { taskSchema } from "../schemas/tarefas.shcemas"
import type { CreateTarefaRequest, TarefaPriority, TarefaStatus, Tarefa } from "../types/tarefas"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getEquipeMembers } from "../services/equipes.service"
import type { ConstructionProjectMember } from "../types/equipes"

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

  const { data: members = [], isLoading: membersLoading } = useQuery<ConstructionProjectMember[]>({
    queryKey: ["equipes", projectId],
    queryFn: () => getEquipeMembers(projectId),
    enabled: projectId !== null && projectId > 0,
  })

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

  const title = tarefaToEdit ? "Editar tarefa" : "Criar tarefa"

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-6 pt-5 pb-2 grid grid-cols-1 gap-4">
          <div>
            <Label>Titulo</Label>
            <Input {...form.register("title")} disabled={readOnly} />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label>Descrição</Label>
            <textarea
              className="w-full rounded-xl px-4 py-3 bg-surface-container-highest text-on-surface text-sm border border-outline-variant"
              {...form.register("description")}
              disabled={readOnly}
            />
            {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select {...form.register("status")} disabled={readOnly}>
                <option value="TODO">Pendente</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="BLOCKED">Bloqueada</option>
                <option value="DONE">Concluída</option>
              </Select>
              {errors.status && <p className="text-xs text-error mt-1">{errors.status.message}</p>}
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select {...form.register("priority")} disabled={readOnly}>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </Select>
              {errors.priority && <p className="text-xs text-error mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início Planejada</Label>
              <Input type="date" min={today} {...form.register("plannedStartDate")} disabled={readOnly} />
              {errors.plannedStartDate && <p className="text-xs text-error mt-1">{errors.plannedStartDate.message}</p>}
            </div>
            <div>
              <Label>Data de Término Planejada</Label>
              <Input type="date" min={today} {...form.register("plannedEndDate")} disabled={readOnly} />
              {errors.plannedEndDate && <p className="text-xs text-error mt-1">{errors.plannedEndDate.message}</p>}
            </div>
          </div>

          <div>
            <Label>Responsável</Label>
            <Select defaultValue="" {...form.register("assigneeUserId", { valueAsNumber: true })} disabled={membersLoading || readOnly}>
              <option value="" disabled>-- Selecionar --</option>
              {members
                .filter((m) => m.user.role !== "USER" && m.user.role !== "ADMIN")
                .map((m) => (
                  <option key={m.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
            </Select>
            {errors.assigneeUserId && <p className="text-xs text-error mt-1">{errors.assigneeUserId.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>Cancelar</Button>
          {canMutate && <Button type="submit" disabled={isCreating}>{isCreating ? "Salvando..." : "Salvar"}</Button>}
        </div>
      </form>
    </Modal>
  )
}