import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, useNavigate } from "react-router-dom"
import { tv } from "tailwind-variants"

import { ProgressRing } from "@/shared/components/ui/progress-ring/ProgressRing"
import { useProjectList } from "@/shared/hooks/useProjectList"
import { ProjectStatus } from "@/shared/types/project"
import { dateProgress, deriveStatus } from "@/shared/utils/status"

const row = tv({
  base: "flex h-9 items-center gap-2.5 rounded-sm px-3 text-[13.5px] transition-colors",
  variants: {
    active: {
      true: "bg-raised text-ink",
      false: "text-ink-2 hover:bg-raised hover:text-ink",
    },
  },
})

interface SidebarProjectsProps {
  /** Pode criar obra — senão o atalho "Nova obra" some. */
  canCreate: boolean
}

/**
 * Obras em andamento, com o anel de progresso ao lado de cada uma (DS v2,
 * Layout). O anel fica `danger` quando a obra passou do prazo.
 */
export function SidebarProjects({ canCreate }: SidebarProjectsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const active = useProjectList().filter((project) => project.status === ProjectStatus.IN_PROGRESS)

  return (
    <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-3">
      <p className="px-3 pb-2 text-[12px] font-semibold text-ink-3">{t("sidebar.inProgress")}</p>

      {active.map((project) => {
        const late =
          deriveStatus({ status: project.status, plannedEndDate: project.plannedEndDate }).state === "late"

        return (
          <NavLink key={project.id} to={`/obras/${project.id}`} className={({ isActive }) => row({ active: isActive })}>
            <ProgressRing
              value={dateProgress(project.plannedStartDate, project.plannedEndDate)}
              tone={late ? "danger" : "gold"}
            />
            <span className="truncate">{project.title}</span>
          </NavLink>
        )
      })}

      {canCreate && (
        <button
          type="button"
          onClick={() => navigate("/obras?nova=1")}
          className="mt-1 flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 text-[13.5px] text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <Plus size={16} />
          {t("sidebar.newObra")}
        </button>
      )}
    </div>
  )
}
