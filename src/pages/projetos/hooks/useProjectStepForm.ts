import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "react-toastify"

import type { Project } from "@/shared/types/project"

import { PROJECT_FORM_DEFAULTS, projectSchema, STEP1_FIELDS } from "../schemas/projectSchema"
import type { ProjectFormData } from "../schemas/projectSchema"
import { useCepLookup } from "./useCepLookup"
import { useCreateProject } from "./useCreateProject"
import { useEditProject } from "./useEditProject"

export type ProjectStep = 1 | 2

interface UseProjectStepFormArgs {
  open: boolean
  project?: Project | null
  onClose: () => void
}

export interface UseProjectStepFormResult {
  form: UseFormReturn<ProjectFormData>
  step: ProjectStep
  isEdit: boolean
  isSaving: boolean
  isLookingUp: boolean
  /** Ref do campo Número: recebe o foco quando o CEP preenche o resto. */
  numeroRef: React.RefObject<HTMLInputElement | null>
  handleNext: () => void
  handleBack: () => void
  handleSave: () => void
  /** Digitação no CEP — só ela autoriza o preenchimento automático. */
  handleCepChange: (digits: string) => void
}

function valuesFrom(project: Project): ProjectFormData {
  return {
    ...PROJECT_FORM_DEFAULTS,
    title: project.title,
    projectType: project.projectType,
    category: project.category,
    status: project.status,
    landArea: project.landArea,
    builtArea: project.builtArea,
    plannedStartDate: project.plannedStartDate ?? "",
    plannedEndDate: project.plannedEndDate ?? "",
    cep: project.zipCode?.replace(/\D/g, "") ?? "",
    logradouro: project.street ?? "",
    numero: project.number ?? "",
    complemento: project.complement ?? "",
    bairro: project.neighborhood ?? "",
    cidade: project.city ?? "",
    uf: project.state ?? "",
  }
}

function payloadFrom(data: ProjectFormData) {
  return {
    title: data.title,
    street: data.logradouro,
    number: data.numero,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.cidade,
    state: data.uf,
    zipCode: data.cep,
    projectType: data.projectType,
    category: data.category,
    status: data.status,
    landArea: data.landArea,
    builtArea: data.builtArea,
    plannedStartDate: data.plannedStartDate,
    plannedEndDate: data.plannedEndDate,
  }
}

/**
 * Estado do cadastro/edição de obra em dois passos. A view só desenha.
 *
 * Os efeitos abaixo vieram do modal antigo e são dívida conhecida (CLAUDE.md
 * §4): reabrir o modal, o aviso de CEP inexistente e o preenchimento com o
 * retorno do viacep.
 */
export function useProjectStepForm({ open, project, onClose }: UseProjectStepFormArgs): UseProjectStepFormResult {
  const [step, setStep] = useState<ProjectStep>(1)
  const numeroRef = useRef<HTMLInputElement | null>(null)
  const cepUserEditedRef = useRef(false)
  const isEdit = !!project

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: PROJECT_FORM_DEFAULTS,
  })

  const { handleCreate, isLoading: isCreating } = useCreateProject({ onSuccess: onClose })
  const { handleEdit, isLoading: isEditing } = useEditProject({ onSuccess: onClose })

  useEffect(() => {
    if (!open) return
    setStep(1)
    cepUserEditedRef.current = false
    form.reset(project ? valuesFrom(project) : PROJECT_FORM_DEFAULTS)
  }, [open, project, form.reset])

  const { cepData, isLookingUp, cepError } = useCepLookup(form.watch("cep"))

  useEffect(() => {
    if (cepError) toast.error(cepError)
  }, [cepError])

  useEffect(() => {
    if (!cepData || !cepUserEditedRef.current) return
    form.setValue("logradouro", cepData.logradouro, { shouldDirty: true })
    form.setValue("bairro", cepData.bairro, { shouldDirty: true })
    form.setValue("cidade", cepData.localidade, { shouldDirty: true })
    form.setValue("uf", cepData.uf, { shouldDirty: true })
    numeroRef.current?.focus()
  }, [cepData, form.setValue])

  function handleNext() {
    form
      .trigger(STEP1_FIELDS)
      .then((valid) => {
        if (valid) setStep(2)
      })
      .catch(() => {})
  }

  function handleSave() {
    form
      .handleSubmit((data) => {
        const payload = payloadFrom(data)
        if (project) handleEdit(project.id, payload)
        else handleCreate(payload)
      })()
      .catch(() => {})
  }

  function handleCepChange(digits: string) {
    cepUserEditedRef.current = true
    form.setValue("cep", digits, { shouldValidate: form.formState.isSubmitted })
  }

  return {
    form,
    step,
    isEdit,
    isSaving: isCreating || isEditing,
    isLookingUp,
    numeroRef,
    handleNext,
    handleBack: () => setStep(1),
    handleSave,
    handleCepChange,
  }
}
