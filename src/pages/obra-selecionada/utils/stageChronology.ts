import type { StageFormData } from "../schemas/stageSchema"
import type { Stage } from "../services/stages.service"

/** Data da API (com ou sem hora) no formato do `<input type="date">`. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return ""
  return value.slice(0, 10)
}

interface ChronologyInput {
  data: StageFormData
  /** Etapa em edição — nunca conta como antecessora de si mesma. */
  stageId: number | null
  stages: Stage[]
  projectStartDate: string | null
}

/**
 * As três regras de cronologia que o backend também aplica, validadas antes
 * porque cada uma pede uma correção diferente — um 400 genérico não diria qual
 * data mexer. A "anterior" é a de maior ordem abaixo desta. Devolve a chave de
 * i18n do erro, ou `null` quando está tudo em ordem.
 */
export function stageChronologyError({ data, stageId, stages, projectStartDate }: ChronologyInput): string | null {
  const start = data.plannedStartDate.trim()
  if (!start) return null

  if (projectStartDate && start < toDateInput(projectStartDate)) return "obra.etapas.toasts.startBeforeProject"

  const previous = stages
    .filter((item) => item.id !== stageId && item.displayOrder < data.displayOrder)
    .sort((a, b) => b.displayOrder - a.displayOrder)[0]

  if (!previous) return null
  if (!previous.plannedStartDate) return "obra.etapas.toasts.previousStartRequired"
  if (start < toDateInput(previous.plannedStartDate)) return "obra.etapas.toasts.startBeforePrevious"
  return null
}
