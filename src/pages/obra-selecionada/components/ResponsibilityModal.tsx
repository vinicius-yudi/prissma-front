import { zodResolver } from "@hookform/resolvers/zod"
import { HardHat } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
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

export function ResponsibilityModal({
  member,
  isSaving,
  onClose,
  onSave,
}: ResponsibilityModalProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResponsibilityFormData>({
    resolver: zodResolver(responsibilitySchema),
    defaultValues: { userResponsibility: member.userResponsibility ?? "" },
  })

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={<HardHat size={18} />}
      title={t("obra.schedule.responsibility.title")}
      description={t("obra.schedule.responsibility.subtitle", { name: member.userName })}
    >
      <form
        noValidate
        onSubmit={handleSubmit((data) => onSave(data.userResponsibility))}
        className="px-6 pb-6"
      >
        <Label htmlFor="userResponsibility">{t("obra.schedule.responsibility.field")}</Label>
        <Input
          id="userResponsibility"
          type="text"
          autoFocus
          className="mt-1.5"
          placeholder={t("obra.schedule.responsibility.placeholder")}
          aria-invalid={!!errors.userResponsibility}
          {...register("userResponsibility")}
        />

        {errors.userResponsibility ? (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {t(errors.userResponsibility.message ?? "")}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-on-surface-faint">
            {t("obra.schedule.responsibility.help")}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            {t("obra.schedule.allocation.cancel")}
          </Button>
          <Button type="submit" fullWidth={false} disabled={isSaving}>
            {isSaving
              ? t("obra.schedule.allocation.saving")
              : t("obra.schedule.responsibility.save")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
