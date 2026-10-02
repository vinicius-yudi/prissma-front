import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

/**
 * Obra sem integrante ativo. Não há o que alocar antes de existir equipe, então
 * o CTA leva a Equipes, que é onde a pessoa entra na obra.
 */

interface ScheduleEmptyStateProps {
  projectId: number
}

export function ScheduleEmptyState({ projectId }: ScheduleEmptyStateProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <EmptyState
      icon={<Users size={26} />}
      title={t("obra.schedule.empty.title")}
      body={t("obra.schedule.empty.description")}
      action={
        <Button variant="outline" fullWidth={false} onClick={() => navigate(`/obras/${projectId}/equipes`)}>
          {t("obra.schedule.empty.cta")}
        </Button>
      }
    />
  )
}
