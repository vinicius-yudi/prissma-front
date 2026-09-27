import { ArrowLeft, ArrowRight, Building2, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { StepIndicator } from "@/shared/components/ui/modal/StepIndicator"
import { SPRING_SOFT } from "@/shared/constants/motion"
import type { Project } from "@/shared/types/project"

import { useProjectStepForm } from "../hooks/useProjectStepForm"
import { ProjectAddressStep } from "./ProjectAddressStep"
import { ProjectDataStep } from "./ProjectDataStep"

interface ProjectStepModalProps {
  open: boolean
  onClose: () => void
  project?: Project | null
}

/**
 * Cadastro e edição de obra em dois passos (DS v2): a obra, depois o
 * endereço. O stepper corre com mola; os passos deslizam na horizontal; erro
 * de campo aparece no campo.
 */
export function ProjectStepModal({ open, onClose, project }: ProjectStepModalProps) {
  const { t } = useTranslation()
  const state = useProjectStepForm({ open, project, onClose })
  const { step, isEdit, isSaving } = state

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      {step === 1 ? (
        <Button type="button" variant="outline" fullWidth={false} onClick={onClose} disabled={isSaving}>
          {t("projectModal.cancel")}
        </Button>
      ) : (
        <Button type="button" variant="ghost" fullWidth={false} onClick={state.handleBack} disabled={isSaving}>
          <ArrowLeft size={16} />
          {t("projectModal.back")}
        </Button>
      )}

      {step === 1 ? (
        <Button type="button" fullWidth={false} onClick={state.handleNext} disabled={isSaving}>
          {t("projectModal.next")}
          <ArrowRight size={16} />
        </Button>
      ) : (
        <Button type="button" fullWidth={false} onClick={state.handleSave} disabled={isSaving}>
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? t("projectModal.saving") : t("projectModal.save")}
        </Button>
      )}
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("projectModal.editTitle") : t("projectModal.createTitle")}
      description={isEdit ? t("projectModal.editDescription") : t("projectModal.createDescription")}
      icon={<Building2 size={18} />}
      size="2xl"
      footer={footer}
    >
      <StepIndicator steps={[t("projectModal.steps.obra"), t("projectModal.steps.endereco")]} current={step} />

      <form onSubmit={(event) => event.preventDefault()} noValidate className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 1 ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: step === 1 ? 16 : -16 }}
            transition={SPRING_SOFT}
          >
            {step === 1 ? (
              <ProjectDataStep form={state.form} isEdit={isEdit} />
            ) : (
              <ProjectAddressStep
                form={state.form}
                isLookingUp={state.isLookingUp}
                numeroRef={state.numeroRef}
                handleCepChange={state.handleCepChange}
                project={project}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </Modal>
  )
}
