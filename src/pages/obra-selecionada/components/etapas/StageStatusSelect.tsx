import { ChevronDown } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import type { EtapaStatus } from "@/pages/projetos/types"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"

import { STAGE_SECTIONS } from "../../constants/stageSections"
import type { Stage } from "../../services/stages.service"

interface StageStatusSelectProps {
  stage: Stage
  canEdit: boolean
  onChange: (status: EtapaStatus) => void
}

/**
 * Status da etapa como pill; quem edita troca por aqui. É um `<select>`
 * nativo invisível por cima do pill: teclado, leitor de tela e a roda de
 * opções do celular vêm de graça.
 */
export function StageStatusSelect({ stage, canEdit, onChange }: StageStatusSelectProps) {
  const { t } = useTranslation()
  const pill = <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />

  if (!canEdit) return pill

  return (
    <label className="relative inline-flex cursor-pointer items-center gap-1">
      <span className="sr-only">{t("obra.etapas.statusLabel", { name: stage.name })}</span>
      <select
        value={stage.status}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as EtapaStatus)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {STAGE_SECTIONS.map((status) => (
          <option key={status} value={status}>
            {t(`obra.etapas.etapaStatus.${status}`)}
          </option>
        ))}
      </select>
      <span className="pointer-events-none inline-flex items-center gap-1">
        {pill}
        <ChevronDown size={13} className="text-meta" />
      </span>
    </label>
  )
}
