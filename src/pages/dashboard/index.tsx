import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { ProjectCard } from "@/pages/projetos/components/ProjectCard"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { KpiCard } from "@/shared/components/ui/kpi-card/KpiCard"
import { KpiStrip } from "@/shared/components/ui/kpi-card/KpiStrip"
import { PageHeader } from "@/shared/components/ui/page-header/PageHeader"
import { Ticker } from "@/shared/components/ui/ticker/Ticker"

import { DashboardAttention } from "./components/DashboardAttention"
import { WeekAgenda } from "./components/WeekAgenda"
import { useDashboard } from "./hooks/useDashboard"

function greetingKey(hour: number): string {
  if (hour < 12) return "dashboard.greeting.morning"
  if (hour < 18) return "dashboard.greeting.afternoon"
  return "dashboard.greeting.evening"
}

/**
 * Início (DS v2): saudação, faixa de KPIs, o que precisa de decisão, a semana
 * e as obras em andamento. Tudo vem das obras da conta e das tarefas
 * atribuídas a mim.
 */
export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const data = useDashboard()
  const firstName = user?.name.split(" ")[0] ?? ""
  const today = new Date().toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" })
  const lateCount = data.alerts.length

  return (
    <div>
      <PageHeader
        eyebrow={today}
        title={t(greetingKey(new Date().getHours()), { name: firstName })}
        subtitle={lateCount > 0 ? t("dashboard.summaryLate", { count: lateCount }) : t("dashboard.summaryClear")}
      />

      <KpiStrip className="mb-6">
        <KpiCard bare label={t("dashboard.kpi.inProgress")} value={<Ticker value={data.inProgress.length} />}>
          {t("dashboard.kpi.planning", { count: data.planningCount })}
        </KpiCard>
        <KpiCard bare label={t("dashboard.kpi.openTasks")} value={<Ticker value={data.openTaskCount} />}>
          {t("dashboard.kpi.dueThisWeek", { count: data.weekTaskCount })}
        </KpiCard>
        <KpiCard bare danger={lateCount > 0} label={t("dashboard.kpi.late")} value={<Ticker value={lateCount} />}>
          {t("dashboard.kpi.lateHint")}
        </KpiCard>
        <KpiCard bare label={t("dashboard.kpi.completed")} value={<Ticker value={data.completedCount} />}>
          {t("dashboard.kpi.ofTotal", { count: data.totalCount })}
        </KpiCard>
      </KpiStrip>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <DashboardAttention alerts={data.alerts} />
        <WeekAgenda week={data.week} />
      </div>

      <div className="mt-10 mb-4 flex items-end justify-between">
        <h2 className="t-section text-[20px] text-ink">{t("dashboard.inProgressTitle")}</h2>
        <Link to="/obras" className="text-[13px] font-[620] text-gold-hi hover:underline">
          {t("dashboard.allProjects")}
        </Link>
      </div>

      {data.inProgress.length === 0 ? (
        <EmptyState title={t("dashboard.inProgressEmpty")} body={t("dashboard.inProgressEmptyHint")} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.inProgress.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
