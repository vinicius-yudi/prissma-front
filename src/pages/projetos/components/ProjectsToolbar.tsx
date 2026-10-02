import { LayoutGrid, Rows3, Search, X } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Segmented } from "@/shared/components/ui/segmented/Segmented"
import { Select } from "@/shared/components/ui/select/Select"
import { SPRING } from "@/shared/constants/motion"

import type { ProjectStats } from "../hooks/useProjects"
import { ProjectFilter, ProjectSort, ProjectView } from "../types"

const viewButton = tv({
  base: "relative flex size-8 cursor-pointer items-center justify-center rounded-[7px]",
  variants: {
    active: {
      true: "text-ink",
      false: "text-meta hover:text-ink-2",
    },
  },
})

const VIEWS = [
  { value: ProjectView.GRID, icon: LayoutGrid, labelKey: "projects.view.grid" },
  { value: ProjectView.LIST, icon: Rows3, labelKey: "projects.view.list" },
] as const

interface ProjectsToolbarProps {
  stats: ProjectStats
  filter: ProjectFilter
  onFilter: (value: ProjectFilter) => void
  search: string
  onSearch: (value: string) => void
  sort: ProjectSort
  onSort: (value: ProjectSort) => void
  view: ProjectView
  onView: (value: ProjectView) => void
}

/** Recorte, busca, ordenação e visualização da lista de obras — tudo na URL. */
export function ProjectsToolbar(props: ProjectsToolbarProps) {
  const { t } = useTranslation()
  const { stats } = props

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Segmented
        id="projects-filter"
        label={t("projects.filter.label")}
        value={props.filter}
        onChange={props.onFilter}
        options={[
          { value: ProjectFilter.ALL, label: t("projects.filter.all"), count: stats.total },
          { value: ProjectFilter.IN_PROGRESS, label: t("projects.filter.inProgress"), count: stats.inProgress },
          { value: ProjectFilter.PLANNING, label: t("projects.filter.planning"), count: stats.planning },
          { value: ProjectFilter.COMPLETED, label: t("projects.filter.completed"), count: stats.completed },
          { value: ProjectFilter.OVERDUE, label: t("projects.filter.overdue"), count: stats.overdue, alert: stats.overdue > 0 },
        ]}
      />

      <div className="flex items-center gap-2">
        <label className="relative flex-1 lg:w-64 lg:flex-none">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-meta" />
          <input
            type="search"
            value={props.search}
            onChange={(event) => props.onSearch(event.target.value)}
            placeholder={t("projects.searchPlaceholder")}
            aria-label={t("projects.searchLabel")}
            // `text-base` no celular: abaixo de 16px o Safari do iOS dá zoom ao focar.
            className="h-10 w-full rounded-[10px] bg-surface pr-8 pl-9 text-base text-ink outline-none hairline placeholder:text-ink-3 focus:inset-ring-2 focus:inset-ring-gold sm:text-[14px] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {props.search && (
            <button
              type="button"
              onClick={() => props.onSearch("")}
              aria-label={t("projects.searchClear")}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-meta hover:bg-raised"
            >
              <X size={13} />
            </button>
          )}
        </label>

        <div className="w-44 flex-none">
          <Select
            value={props.sort}
            onChange={(event) => props.onSort(event.target.value as ProjectSort)}
            aria-label={t("projects.sort.label")}
            className="h-10 bg-surface text-[13.5px]"
          >
            <option value={ProjectSort.RECENT}>{t("projects.sort.recent")}</option>
            <option value={ProjectSort.DEADLINE}>{t("projects.sort.deadline")}</option>
            <option value={ProjectSort.NAME}>{t("projects.sort.name")}</option>
          </Select>
        </div>

        <div className="flex flex-none rounded-[10px] bg-surface p-1 hairline" role="group" aria-label={t("projects.view.label")}>
          {VIEWS.map(({ value, icon: Icon, labelKey }) => {
            const active = props.view === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => props.onView(value)}
                aria-pressed={active}
                aria-label={t(labelKey)}
                title={t(labelKey)}
                className={viewButton({ active })}
              >
                {active && (
                  <motion.span layoutId="projects-view" className="absolute inset-0 rounded-[7px] bg-raised" transition={SPRING} />
                )}
                <Icon size={16} className="relative" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
