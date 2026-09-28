import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { allocationSchema, type AllocationFormData } from "../schemas/schedule.schema"
import type { DaySchedule, MemberSchedule } from "../types/schedule"
import { formatFullDate } from "../utils/scheduleFormat"

/**
 * Alocação de horas de um integrante num dia.
 *
 * O pai monta com `key={userId-date}`, então o formulário nasce zerado a cada
 * célula — sem effect de reset. Liberar o dia apaga a alocação no backend, por
 * isso pede confirmação no próprio modal.
 */

interface AllocationModalProps {
  member: MemberSchedule
  day: DaySchedule
  isSaving: boolean
  onClose: () => void
  onSave: (hours: number) => void
}

export function AllocationModal({ member, day, isSaving, onClose, onSave }: AllocationModalProps) {
  const { t, i18n } = useTranslation()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    // Nasce vazio, mesmo num dia já alocado: o valor atual vira placeholder.
    // Campo pré-preenchido convida a salvar sem ler, e aqui salvar sem ler
    // sobrescreve a alocação de outra pessoa.
    defaultValues: {},
  })
  const submit = handleSubmit((data) => onSave(data.allocatedHours))
  const dateLabel = formatFullDate(day.date, i18n.language)

  const footer = confirmingClear ? (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <p className="text-[13px] text-ink-2">{t("obra.schedule.allocation.confirmClear", { name: member.userName, date: dateLabel })}</p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" fullWidth={false} onClick={() => setConfirmingClear(false)}>
          {t("obra.schedule.allocation.cancel")}
        </Button>
        <Button type="button" variant="destructive" size="sm" fullWidth={false} disabled={isSaving} onClick={() => onSave(0)}>
          {t("obra.schedule.allocation.confirmClearAction")}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex w-full items-center justify-between gap-2">
      {day.allocated ? (
        <Button type="button" variant="ghost" fullWidth={false} onClick={() => setConfirmingClear(true)} className="text-danger hover:bg-danger-soft hover:text-danger">
          {t("obra.schedule.allocation.clear")}
        </Button>
      ) : (
        <span />
      )}
      <Button fullWidth={false} disabled={isSaving} onClick={() => void submit()}>
        {isSaving ? t("obra.schedule.allocation.saving") : t("obra.schedule.allocation.save")}
      </Button>
    </div>
  )

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={<CalendarClock size={18} />}
      title={t("obra.schedule.allocation.title")}
      description={t("obra.schedule.allocation.subtitle", { name: member.userName, date: dateLabel })}
      footer={footer}
    >
      {/* `noValidate`: sem isto o navegador barra o submit com um balão
          nativo, em inglês e fora do design. Quem valida é o zod. */}
      <form
        noValidate
        className="px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <Field
          label={t("obra.schedule.allocation.hours")}
          hint={t("obra.schedule.allocation.help")}
          error={errors.allocatedHours?.message && t(errors.allocatedHours.message)}
        >
          {(id) => (
            // `text` + `inputMode`, não `number`: o spinner não cabe ao lado do
            // sufixo "h", e `maxLength` é ignorado em `type="number"`.
            <Input
              id={id}
              type="text"
              inputMode="numeric"
              maxLength={2}
              autoFocus
              autoComplete="off"
              className="t-num"
              placeholder={day.allocated ? String(day.allocatedHours) : undefined}
              suffix={t("obra.schedule.allocation.hoursSuffix")}
              aria-invalid={!!errors.allocatedHours}
              {...register("allocatedHours", { valueAsNumber: true })}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
