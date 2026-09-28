import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

/**
 * Falha ao carregar a grade. O retry refaz a consulta e **não navega** — erro
 * de sistema mantém o usuário onde está (Fluxos v2 §10).
 */

interface ScheduleErrorStateProps {
  onRetry: () => void
}

export function ScheduleErrorState({ onRetry }: ScheduleErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-12 text-center">
      <div className="rounded-2xl bg-danger-bg p-4 text-danger">
        <AlertTriangle size={28} />
      </div>
      <p className="text-sm text-on-surface-variant">{t("obra.schedule.error.title")}</p>
      <Button variant="outline" fullWidth={false} onClick={onRetry}>
        {t("obra.schedule.error.retry")}
      </Button>
    </div>
  )
}
