import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { allocationSchema, type AllocationFormData } from "../schemas/schedule.schema"
import type { DaySchedule, MemberSchedule } from "../types/schedule"
import { formatFullDate } from "../utils/scheduleFormat"

/**
 * Alocação de horas de um integrante num dia.
 *
 * O pai monta com `key={userId-date}`, então o formulário nasce zerado a cada
 * célula — sem effect de reset. Liberar o dia é uma ação destrutiva (apaga a
 * alocação no backend), por isso pede confirmação antes de sair daqui.
 */

interface AllocationModalProps {
  member: MemberSchedule
  day: DaySchedule
  isSaving: boolean
  onClose: () => void
  onSave: (hours: number) => void
}

export function AllocationModal({
  member,
  day,
  isSaving,
  onClose,
  onSave,
}: AllocationModalProps) {
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

  const dateLabel = formatFullDate(day.date, i18n.language)

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={<CalendarClock size={18} />}
      title={t("obra.schedule.allocation.title")}
      description={t("obra.schedule.allocation.subtitle", {
        name: member.userName,
        date: dateLabel,
      })}
    >
      {/* `noValidate`: sem isto o jsdom e o navegador barram o submit pelo
          `max`/`step` do input e o usuário recebe um balão nativo, em inglês e
          fora do design. Quem valida é o zod, com a mensagem no campo. */}
      <form
        noValidate
        onSubmit={handleSubmit((data) => onSave(data.allocatedHours))}
        className="px-6 pb-6"
      >
        <Label htmlFor="allocatedHours">{t("obra.schedule.allocation.hours")}</Label>
        {/* `text` + `inputMode`, não `number`: o spinner do input numérico não
            cabe ao lado do sufixo "h", e `maxLength` é ignorado em
            `type="number"` — sem ele nada impediria digitar 999. Dois dígitos
            é o teto real do campo, já que o máximo é 24. */}
        <Input
          id="allocatedHours"
          type="text"
          inputMode="numeric"
          maxLength={2}
          autoFocus
          autoComplete="off"
          className="mt-1.5"
          placeholder={day.allocated ? String(day.allocatedHours) : undefined}
          suffix={t("obra.schedule.allocation.hoursSuffix")}
          aria-invalid={!!errors.allocatedHours}
          {...register("allocatedHours", { valueAsNumber: true })}
        />

        {errors.allocatedHours ? (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {t(errors.allocatedHours.message ?? "")}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-on-surface-faint">
            {t("obra.schedule.allocation.help")}
          </p>
        )}

        {confirmingClear ? (
          <div className="mt-5 rounded-xl border border-outline bg-surface-container-high p-3.5">
            <p className="text-[12.5px] text-on-surface-variant">
              {t("obra.schedule.allocation.confirmClear", { name: member.userName, date: dateLabel })}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                fullWidth={false}
                disabled={isSaving}
                onClick={() => onSave(0)}
              >
                {t("obra.schedule.allocation.confirmClearAction")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={() => setConfirmingClear(false)}
              >
                {t("obra.schedule.allocation.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            {day.allocated ? (
              <Button
                type="button"
                variant="ghost"
                fullWidth={false}
                onClick={() => setConfirmingClear(true)}
              >
                {t("obra.schedule.allocation.clear")}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" fullWidth={false} disabled={isSaving}>
              {isSaving ? t("obra.schedule.allocation.saving") : t("obra.schedule.allocation.save")}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  )
}
