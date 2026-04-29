import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, MapPin, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { StepIndicator } from "@/shared/components/ui/modal/StepIndicator"
import { Select } from "@/shared/components/ui/select/Select"
import type { Project } from "@/shared/types/project"

import { useCreateProject } from "../hooks/useCreateProject"
import { useEditProject } from "../hooks/useEditProject"
import { useCepLookup } from "../hooks/useCepLookup"
import {
  formatAddress,
  PROJECT_FORM_DEFAULTS,
  projectSchema,
  STEP1_FIELDS,
  STEP2_FIELDS,
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
  const isEdit = !!project

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: PROJECT_FORM_DEFAULTS,
  })

  const { handleCreate, isLoading: isCreating } = useCreateProject({ onSuccess: onClose })
  const { handleEdit, isLoading: isEditing } = useEditProject({ onSuccess: onClose })
  const isLoading = isCreating || isEditing

  // Reset form and step whenever modal opens
  useEffect(() => {
    if (!open) return
    setStep(1)
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
      })
    } else {
      form.reset(PROJECT_FORM_DEFAULTS)
    }
  }, [open, project, form.reset])

  // CEP lookup
  const cepValue = form.watch("cep")
  const { cepData, isLookingUp, cepError } = useCepLookup(cepValue)

  useEffect(() => {
    if (!cepData) return
    form.setValue("logradouro", cepData.logradouro, { shouldValidate: true })
    form.setValue("bairro", cepData.bairro, { shouldValidate: true })
    form.setValue("cidade", cepData.localidade, { shouldValidate: true })
    form.setValue("uf", cepData.uf, { shouldValidate: true })
    numeroRef.current?.focus()
  }, [cepData, form.setValue])

  async function handleNext() {
    const valid = await form.trigger(STEP1_FIELDS)
    if (valid) {
      form.clearErrors(STEP2_FIELDS)
      setStep(2)
    }
  }

  function handleBack() {
    setStep(1)
  }

  function onSubmit(data: ProjectFormData) {
    const address = formatAddress(data)
    const payload = {
      title: data.title,
      address,
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

      <form onSubmit={form.handleSubmit(onSubmit)}>
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
              {form.formState.errors.title && (
                <p className="text-xs text-error mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.type")}</Label>
              <Select className={formInput()} {...form.register("projectType")}>
                <option value="" disabled>{t("registerWork.typePlaceholder")}</option>
                <option value="RESIDENTIAL">{t("registerWork.typeResidential")}</option>
                <option value="COMMERCIAL">{t("registerWork.typeCommercial")}</option>
                <option value="INDUSTRIAL">{t("registerWork.typeIndustrial")}</option>
              </Select>
              {form.formState.errors.projectType && (
                <p className="text-xs text-error mt-1">{form.formState.errors.projectType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.category")}</Label>
              <Select className={formInput()} {...form.register("category")}>
                <option value="" disabled>{t("registerWork.categoryPlaceholder")}</option>
                <option value="BUILDING">{t("registerWork.categoryBuilding")}</option>
                <option value="RENOVATION">{t("registerWork.categoryRenovation")}</option>
              </Select>
              {form.formState.errors.category && (
                <p className="text-xs text-error mt-1">{form.formState.errors.category.message}</p>
              )}
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
              {form.formState.errors.landArea && (
                <p className="text-xs text-error mt-1">{form.formState.errors.landArea.message}</p>
              )}
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
              {form.formState.errors.builtArea && (
                <p className="text-xs text-error mt-1">{form.formState.errors.builtArea.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.startDate")}</Label>
              <Input className={formInput()} type="date" {...form.register("plannedStartDate")} />
              {form.formState.errors.plannedStartDate && (
                <p className="text-xs text-error mt-1">{form.formState.errors.plannedStartDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={formLabel()}>{t("registerWork.endDate")}</Label>
              <Input className={formInput()} type="date" {...form.register("plannedEndDate")} />
              {form.formState.errors.plannedEndDate && (
                <p className="text-xs text-error mt-1">{form.formState.errors.plannedEndDate.message}</p>
              )}
            </div>
          </div>
        )}

        {/* ── PASSO 2: Endereço ── */}
        {step === 2 && (
          <div className="px-6 pt-5 pb-2 space-y-5">
            {isEdit && project?.address && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-surface-container-low rounded-lg border border-outline-variant">
                <MapPin size={14} className="text-on-surface-variant mt-0.5 flex-none" />
                <div>
                  <p className="text-xs text-on-surface-variant mb-0.5">{t("projectModal.currentAddress")}</p>
                  <p className="text-sm text-on-surface">{project.address}</p>
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
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    />
                  )}
                />
                {cepError && <p className="text-xs text-error mt-1">{cepError}</p>}
                {form.formState.errors.cep && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.cep.message}</p>
                )}
              </div>

              {/* UF */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.uf")}</Label>
                <Input
                  className={formInput()}
                  placeholder="SP"
                  readOnly={!!cepData}
                  {...form.register("uf")}
                />
                {form.formState.errors.uf && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.uf.message}</p>
                )}
              </div>

              {/* Logradouro */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.logradouro")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.logradouroPlaceholder")}
                  readOnly={!!cepData}
                  {...form.register("logradouro")}
                />
                {form.formState.errors.logradouro && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.logradouro.message}</p>
                )}
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
                {form.formState.errors.numero && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.numero.message}</p>
                )}
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
                  readOnly={!!cepData}
                  {...form.register("bairro")}
                />
                {form.formState.errors.bairro && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.bairro.message}</p>
                )}
              </div>

              {/* Cidade */}
              <div className="space-y-1.5">
                <Label className={formLabel()}>{t("projectModal.cidade")}</Label>
                <Input
                  className={formInput()}
                  placeholder={t("projectModal.cidadePlaceholder")}
                  readOnly={!!cepData}
                  {...form.register("cidade")}
                />
                {form.formState.errors.cidade && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.cidade.message}</p>
                )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("projectModal.saving") : t("projectModal.save")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
