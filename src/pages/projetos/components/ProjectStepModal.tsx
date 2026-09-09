import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, MapPin, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { StepIndicator } from "@/shared/components/ui/modal/StepIndicator"
import { Select } from "@/shared/components/ui/select/Select"
import { formatProjectAddress, type Project } from "@/shared/types/project"
import { getFirstFormErrorMessage } from "@/shared/utils/formValidation"

import { useCreateProject } from "../hooks/useCreateProject"
import { useEditProject } from "../hooks/useEditProject"
import { useCepLookup } from "../hooks/useCepLookup"
import {
  PROJECT_FORM_DEFAULTS,
  projectSchema,
  STEP1_FIELDS,
  type ProjectFormData,
} from "../schemas/projectSchema"

const formLabel = tv({
  base: "block text-xs uppercase tracking-widest text-primary font-semibold",
})

const formInput = tv({
  base: "bg-surface-container-highest text-on-surface [&_option]:bg-surface-container-highest focus:ring-1",
})

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

interface ProjectStepModalProps {
  open: boolean
  onClose: () => void
  project?: Project | null
}

export function ProjectStepModal({ open, onClose, project }: ProjectStepModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const numeroRef = useRef<HTMLInputElement | null>(null)
  const cepUserEditedRef = useRef(false)
  const isEdit = !!project

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: PROJECT_FORM_DEFAULTS,
  })

  const { handleCreate, isLoading: isCreating } = useCreateProject({ onSuccess: onClose })
  const { handleEdit, isLoading: isEditing } = useEditProject({ onSuccess: onClose })
  const isLoading = isCreating || isEditing

  useEffect(() => {
    if (!open) return
    setStep(1)
    cepUserEditedRef.current = false
    if (project) {
      form.reset({
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
      })
    } else {
      form.reset(PROJECT_FORM_DEFAULTS)
    }
  }, [open, project, form.reset])

  const cepValue = form.watch("cep")
  const { cepData, isLookingUp, cepError } = useCepLookup(cepValue)

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

  async function handleNext() {
    const valid = await form.trigger(STEP1_FIELDS)
    if (!valid) {
      const message = STEP1_FIELDS.map((field) => form.getFieldState(field).error?.message)
        .find((errorMessage): errorMessage is string => Boolean(errorMessage))
      if (message) toast.error(message)
      return
    }
    form.clearErrors()
    setStep(2)
  }

  function handleBack() {
    setStep(1)
  }

  function handleSave() {
    form.handleSubmit(onSubmit, onInvalid)()
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const message = getFirstFormErrorMessage(errors)
    if (message) toast.error(message)
  }

  function onSubmit(data: ProjectFormData) {
    const payload = {
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
    if (isEdit && project) {
      handleEdit(project.id, payload)
    } else {
      handleCreate(payload)
    }
  }

  const steps = [t("projectModal.steps.obra"), t("projectModal.steps.endereco")]

  const { ref: numeroRegisterRef, ...numeroRegisterProps } = form.register("numero")
  const numeroMergedRef = (el: HTMLInputElement | null) => {
    numeroRegisterRef(el)
    numeroRef.current = el
  }

  const errors = form.formState.errors

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("projectModal.editTitle") : t("projectModal.createTitle")}
      description={isEdit ? t("projectModal.editDescription") : t("projectModal.createDescription")}
      icon={<Building2 size={18} />}
      variant="default"
      size="2xl"
    >
      <div className="sticky top-0 bg-surface-container border-b border-outline-variant z-10">
        <StepIndicator steps={steps} current={step} />
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* ── PASSO 1: Dados da Obra ── */}
        {step === 1 && (
          <div className="px-6 pt-5 pb-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.name")}</Label>
              <Input
                className={formInput()}
                placeholder={t("registerWork.namePlaceholder")}
                {...form.register("title")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.type")}</Label>
              <Select className={formInput()} {...form.register("projectType")}>
                <option value="" disabled>{t("registerWork.typePlaceholder")}</option>
                <option value="RESIDENTIAL">{t("registerWork.typeResidential")}</option>
                <option value="COMMERCIAL">{t("registerWork.typeCommercial")}</option>
                <option value="INDUSTRIAL">{t("registerWork.typeIndustrial")}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.category")}</Label>
              <Select className={formInput()} {...form.register("category")}>
                <option value="" disabled>{t("registerWork.categoryPlaceholder")}</option>
                <option value="BUILDING">{t("registerWork.categoryBuilding")}</option>
                <option value="RENOVATION">{t("registerWork.categoryRenovation")}</option>
              </Select>
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projects.editModal.status")}</Label>
                <Select className={formInput()} {...form.register("status")}>
                  <option value="PLANNING">{t("projects.status.planning")}</option>
                  <option value="IN_PROGRESS">{t("projects.status.inProgress")}</option>
                  <option value="PAUSED">{t("projects.status.paused")}</option>
                  <option value="COMPLETED">{t("projects.status.completed")}</option>
                  <option value="CANCELLED">{t("projects.status.cancelled")}</option>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.landArea")}</Label>
              <Input
                className={formInput()}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("landArea", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.builtArea")}</Label>
              <Input
                className={formInput()}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("builtArea", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.startDate")}</Label>
              <Input className={formInput()} type="date" {...form.register("plannedStartDate")} />
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.endDate")}</Label>
              <Input className={formInput()} type="date" {...form.register("plannedEndDate")} />
            </div>
          </div>
        )}

        {/* ── PASSO 2: Endereço ── */}
        {step === 2 && (
          <div className="px-6 pt-5 pb-2 space-y-5">
            {isEdit && project && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-surface-container-low rounded-lg border border-outline-variant">
                <MapPin size={14} className="text-on-surface-variant mt-0.5 flex-none" />
                <div>
                  <p className="text-xs text-on-surface-variant mb-0.5">{t("projectModal.currentAddress")}</p>
                  <p className="text-sm text-on-surface">{formatProjectAddress(project)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* CEP */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.cep")}</Label>
                <Controller
                  name="cep"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      className={formInput()}
                      placeholder={t("projectModal.cepPlaceholder")}
                      suffix={
                        isLookingUp
                          ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          : <Search size={14} className="text-on-surface-variant" />
                      }
                      value={maskCep(field.value)}
                      onChange={(e) => {
                        cepUserEditedRef.current = true
                        field.onChange(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }}
                    />
                  )}
                />
              </div>

              {/* UF */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.uf")}</Label>
                <Input
                  className={formInput()}
                  placeholder="SP"
                  {...form.register("uf")}
                />
              </div>

              {/* Logradouro */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.logradouro")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.logradouroPlaceholder")}
                  {...form.register("logradouro")}
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.numero")}</Label>
                <Input
                  ref={numeroMergedRef}
                  className={formInput()}
                  placeholder="123"
                  {...numeroRegisterProps}
                />
              </div>

              {/* Complemento */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.complemento")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.complementoPlaceholder")}
                  {...form.register("complemento")}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.bairro")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.bairroPlaceholder")}
                  {...form.register("bairro")}
                />
              </div>

              {/* Cidade */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.cidade")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.cidadePlaceholder")}
                  {...form.register("cidade")}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer de navegação ── */}
        <div className="flex items-center justify-between gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
          {step === 1 ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t("projectModal.cancel")}
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isLoading}>
              ← {t("projectModal.back")}
            </Button>
          )}

          {step === 1 ? (
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              {t("projectModal.next")} →
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? t("projectModal.saving") : t("projectModal.save")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
