import { FolderKanban } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { tv } from "tailwind-variants"

import { ProjectCard } from "@/pages/projetos/components/ProjectCard"
import { Num } from "@/shared/components/ui/num/Num"

import { STATIC_STATS } from "./constants"
import { useDashboard } from "./hooks/useDashboard"

const statCard = tv({
  base: "rounded-xl border border-outline-variant border-t-3 p-5",
  variants: {
    tone: {
      ok: "border-t-ok bg-ok/5",
      warn: "border-t-warn bg-warn/5",
    },
  },
})

const statIcon = tv({
  base: "flex h-10 w-10 items-center justify-center rounded-lg",
  variants: {
    tone: {
      ok: "bg-ok/15 text-ok",
      warn: "bg-warn/15 text-warn",
    },
  },
})

const statValue = tv({
  base: "mt-1 text-3xl font-bold",
  variants: {
    tone: {
      ok: "text-ok",
      warn: "text-warn",
    },
  },
})

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
          <Num className="mt-1 block text-3xl font-bold text-primary">
            {isLoading ? "—" : activeCount}
          </Num>
        </button>

        {STATIC_STATS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.labelKey} className={statCard({ tone: card.tone })}>
              <div className="flex items-start justify-between">
                <div className={statIcon({ tone: card.tone })}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold tracking-wider text-on-surface-variant">
                {t(card.labelKey)}
              </p>
              <Num className={statValue({ tone: card.tone })}>{card.value}</Num>
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
