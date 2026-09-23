import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/**
 * Obra sem integrante ativo.
 *
 * Não há o que alocar antes de existir equipe, então o CTA não abre um modal
 * daqui: manda para Equipes, que é onde a pessoa entra na obra.
 */

interface ScheduleEmptyStateProps {
  projectId: number
}

export function ScheduleEmptyState({ projectId }: ScheduleEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-outline bg-surface-container-low p-12 text-center">
      <div className="rounded-2xl bg-primary/10 p-4 text-primary">
        <Users size={28} />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-on-surface">{t("obra.schedule.empty.title")}</h2>
        <p className="max-w-md text-sm text-on-surface-variant">
          {t("obra.schedule.empty.description")}
        </p>
      </div>
      <Link
        to={`/obras/${projectId}/equipes`}
        className="text-[12.5px] font-semibold text-gold-bright hover:underline"
      >
        {t("obra.schedule.empty.cta")}
      </Link>
    </div>
  )
}
