import { zodResolver } from "@hookform/resolvers/zod"
import { HardHat } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { responsibilitySchema, type ResponsibilityFormData } from "../schemas/schedule.schema"
import type { MemberSchedule } from "../types/schedule"

/**
 * Frente de trabalho do integrante na obra ("Fundação", "Estrutura").
 *
 * Texto livre que só existe para esta tela — por isso mora em
 * `schedule_members`, e não como coluna do vínculo com a obra. Campo vazio
 * limpa a responsabilidade.
 */

interface ResponsibilityModalProps {
  member: MemberSchedule
  isSaving: boolean
  onClose: () => void
  onSave: (userResponsibility: string) => void
}

export function ResponsibilityModal({ member, isSaving, onClose, onSave }: ResponsibilityModalProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResponsibilityFormData>({
    resolver: zodResolver(responsibilitySchema),
    defaultValues: { userResponsibility: member.userResponsibility ?? "" },
  })
  const submit = handleSubmit((data) => onSave(data.userResponsibility))

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={<HardHat size={18} />}
      title={t("obra.schedule.responsibility.title")}
      description={t("obra.schedule.responsibility.subtitle", { name: member.userName })}
      footer={
        <>
          <Button type="button" variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.schedule.allocation.cancel")}
          </Button>
          <Button fullWidth={false} disabled={isSaving} onClick={() => void submit()}>
            {isSaving ? t("obra.schedule.allocation.saving") : t("obra.schedule.responsibility.save")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <Field
          label={t("obra.schedule.responsibility.field")}
          hint={t("obra.schedule.responsibility.help")}
          error={errors.userResponsibility?.message && t(errors.userResponsibility.message)}
        >
          {(id) => (
            <Input
              id={id}
              type="text"
              autoFocus
              placeholder={t("obra.schedule.responsibility.placeholder")}
              aria-invalid={!!errors.userResponsibility}
              {...register("userResponsibility")}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
