import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import { QUICK_ADD_DAYS, TASK_PRIORITY, TASK_STATUS } from "../constants/kanban"
import { taskSchema, type AutosaveField, type TaskFormData } from "../schemas/task.schema"
import type { Stage } from "../services/stages.service"
import type { TarefaComEtapa, TarefaStatus } from "../types/tarefas"
import { quickAddDates } from "../utils/taskDates"
import type { useTaskActions } from "./useTaskActions"

type TaskActions = ReturnType<typeof useTaskActions>

interface UseTaskFormArgs {
  /** Tarefa aberta; `null` cria. */
  item: TarefaComEtapa | null
  stages: Stage[]
  /** Etapa sugerida ao criar. */
  defaultStage: Stage | null
  actions: TaskActions
  onCreated: () => void
}

export interface UseTaskFormResult {
  form: UseFormReturn<TaskFormData>
  isEdit: boolean
  /** Etapa selecionada — a data mínima de início vem dela. */
  stageStart: string | undefined
  /** Salva um campo ao sair dele (só em edição, só se mudou e é válido). */
  saveField: (name: AutosaveField) => void
  changeStatus: (status: TarefaStatus) => void
  handleCreate: () => void
}

function valuesFrom(item: TarefaComEtapa): TaskFormData {
  const { tarefa } = item
  return {
    title: tarefa.title,
    description: tarefa.description ?? "",
    priority: tarefa.priority,
    status: tarefa.status,
    stageId: item.stageId,
    plannedStartDate: tarefa.plannedStartDate?.slice(0, 10) ?? "",
    plannedEndDate: tarefa.plannedEndDate?.slice(0, 10) ?? "",
    assigneeUserId: tarefa.assigneeUserId,
  }
}

function blankValues(stage: Stage | null): TaskFormData {
  return {
    title: "",
    description: "",
    priority: TASK_PRIORITY.MEDIUM,
    status: TASK_STATUS.TODO,
    stageId: stage?.id ?? 0,
    ...quickAddDates(stage?.plannedStartDate ?? null, QUICK_ADD_DAYS),
    assigneeUserId: null,
  }
}

/**
 * Formulário do drawer de tarefa. Em edição não há "Salvar": cada campo grava
 * ao sair dele (o PATCH é parcial). Ao criar, um botão envia tudo. Os valores
 * iniciais saem no mount — o drawer monta o formulário a cada abertura.
 */
export function useTaskForm({ item, stages, defaultStage, actions, onCreated }: UseTaskFormArgs): UseTaskFormResult {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: item ? valuesFrom(item) : blankValues(defaultStage),
    mode: "onTouched",
  })
  const stageId = useWatch({ control: form.control, name: "stageId" })
  const stageStart = stages.find((s) => s.id === stageId)?.plannedStartDate?.slice(0, 10)

  /** Regra que o schema não vê: a tarefa não começa antes da etapa. */
  function startFitsStage(start: string): boolean {
    if (!stageStart) {
      // Em edição a etapa não aparece como campo: o aviso vai na data.
      form.setError(item ? "plannedStartDate" : "stageId", { message: "obra.tarefas.validation.stageStartDateRequired" })
      return false
    }
    if (start < stageStart) {
      form.setError("plannedStartDate", { message: "obra.tarefas.validation.plannedStartDateBeforeStage" })
      return false
    }
    return true
  }

  async function saveField(name: AutosaveField) {
    if (!item) return
    const valid = await form.trigger(name)
    const value = form.getValues(name)
    if (!valid || value === valuesFrom(item)[name]) return
    if (name === "plannedStartDate" && !startFitsStage(String(value))) return
    actions.patch(item, { [name]: typeof value === "string" ? value.trim() : value })
  }

  function changeStatus(status: TarefaStatus) {
    form.setValue("status", status)
    if (item) actions.move(item, status)
  }

  async function create(data: TaskFormData) {
    if (!startFitsStage(data.plannedStartDate)) return
    const { stageId: target, ...payload } = data
    try {
      await actions.createAsync({ stageId: target, payload: { ...payload, title: payload.title.trim() } })
      onCreated()
    } catch {
      // O toast de erro sai do hook de mutation; o drawer fica aberto.
    }
  }

  return {
    form,
    isEdit: item !== null,
    stageStart,
    saveField: (name) => void saveField(name),
    changeStatus,
    handleCreate: () => void form.handleSubmit(create)(),
  }
}
