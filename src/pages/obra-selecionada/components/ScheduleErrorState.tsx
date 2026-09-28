import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

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
    <EmptyState
      title={t("obra.schedule.error.title")}
      action={
        <Button variant="outline" fullWidth={false} onClick={onRetry}>
          <RefreshCw size={14} />
          {t("obra.schedule.error.retry")}
        </Button>
      }
    />
  )
}
