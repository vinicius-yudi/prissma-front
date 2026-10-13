import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import { STAGE_FORM_DEFAULTS, stageSchema, type StageFormData } from "../schemas/stageSchema"
import type { Stage } from "../services/stages.service"
import { stageChronologyError, toDateInput } from "../utils/stageChronology"
import { useStages } from "./useStages"

interface UseStageFormArgs {
  projectId: number
  projectStartDate: string | null
  stages: Stage[]
  /** Etapa em edição; `null` cria. */
  stage: Stage | null
  suggestedDisplayOrder: number
  onSaved: () => void
}

export interface UseStageFormResult {
  form: UseFormReturn<StageFormData>
  handleSave: () => void
  isSaving: boolean
}

function valuesFrom(stage: Stage): StageFormData {
  return {
    name: stage.name,
    description: stage.description ?? "",
    displayOrder: stage.displayOrder,
    status: stage.status,
    plannedStartDate: toDateInput(stage.plannedStartDate),
    plannedEndDate: toDateInput(stage.plannedEndDate),
  }
}

function payloadFrom(data: StageFormData) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    displayOrder: data.displayOrder,
    status: data.status,
    plannedStartDate: data.plannedStartDate,
    plannedEndDate: data.plannedEndDate,
  }
}

/**
 * Formulário de etapa. Os valores iniciais saem da etapa no mount: quem abre o
 * modal troca a `key` a cada abertura, então não há `reset` sincronizado por
 * effect. Erro de campo (inclusive de cronologia) vai no campo; o toast fica
 * para o erro do servidor, que o `useStages` já mostra.
 */
export function useStageForm(args: UseStageFormArgs): UseStageFormResult {
  const { createAsync, updateAsync, isCreating, isUpdating } = useStages(args.projectId)
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: args.stage
      ? valuesFrom(args.stage)
      : { ...STAGE_FORM_DEFAULTS, displayOrder: args.suggestedDisplayOrder },
  })

  async function save(data: StageFormData) {
    const chronology = stageChronologyError({
      data,
      stageId: args.stage?.id ?? null,
      stages: args.stages,
      projectStartDate: args.projectStartDate,
    })
    if (chronology) {
      form.setError("plannedStartDate", { message: chronology }, { shouldFocus: true })
      return
    }

    const payload = payloadFrom(data)
    try {
      if (args.stage) await updateAsync({ id: args.stage.id, payload })
      else await createAsync(payload)
      args.onSaved()
    } catch {
      // O toast de erro sai do hook de mutation; o modal fica aberto.
    }
  }

  return {
    form,
    handleSave: () => void form.handleSubmit(save)(),
    isSaving: isCreating || isUpdating,
  }
}
