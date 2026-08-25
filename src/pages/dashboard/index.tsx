import { CalendarDays, ClipboardCheck, FolderKanban } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ProjectCard } from "@/pages/projetos/components/ProjectCard"

import { useDashboard } from "./hooks/useDashboard"

const STATIC_STATS = [
  {
    icon: ClipboardCheck,
    labelKey: "dashboard.stats.pendingTasks",
    detailKey: "dashboard.stats.pendingTasksDetail",
    value: 14,
    accent: "border-t-secondary bg-secondary/5",
    iconBg: "bg-secondary/15 text-secondary",
    valueColor: "text-secondary",
  },
  {
    icon: CalendarDays,
    labelKey: "dashboard.stats.nextVisits",
    detailKey: "dashboard.stats.nextVisitsDetail",
    value: 3,
    accent: "border-t-tertiary bg-tertiary/5",
    iconBg: "bg-tertiary/15 text-tertiary",
    valueColor: "text-tertiary",
  },
] as const

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCount, inProgressProjects, isLoading } = useDashboard()

  function handleProjectsNav() {
    navigate("/obras")
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t("dashboard.title")}</h1>
        <p className="text-sm text-on-surface-variant">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={handleProjectsNav}
          className="rounded-xl border border-outline-variant border-t-3 p-5 border-t-primary bg-primary/5 text-left hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold tracking-wider text-on-surface-variant">
            {t("dashboard.stats.activeProjects")}
          </p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {isLoading ? "—" : activeCount}
          </p>
        </button>

        {STATIC_STATS.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.labelKey}
              className={`rounded-xl border border-outline-variant border-t-3 p-5 ${card.accent}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold tracking-wider text-on-surface-variant">
                {t(card.labelKey)}
              </p>
              <p className={`mt-1 text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{t(card.detailKey)}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-on-surface mb-4">
          {t("dashboard.inProgressTitle")}
        </h2>
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && inProgressProjects.length === 0 && (
          <p className="text-sm text-on-surface-variant">{t("dashboard.inProgressEmpty")}</p>
        )}
        {!isLoading && inProgressProjects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgressProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
