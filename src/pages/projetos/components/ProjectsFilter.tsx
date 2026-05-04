import { Search } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { ProjectStats } from "../hooks/useProjects"
import { ProjectFilter } from "../types"

const filterButton = tv({
  base: "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
  variants: {
    active: {
      true: "bg-primary text-on-primary shadow-sm",
      false: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
    },
  },
})

const filterBadge = tv({
  base: "text-xs px-1.5 py-0.5 rounded-full font-semibold",
  variants: {
    active: {
      true: "bg-on-primary/15 text-on-primary",
      false: "bg-outline-variant/50 text-on-surface-variant",
    },
  },
})

interface FilterOption {
  value: ProjectFilter
  labelKey: string
  countKey: keyof ProjectStats
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: ProjectFilter.ALL, labelKey: "projects.filter.all", countKey: "total" },
  { value: ProjectFilter.IN_PROGRESS, labelKey: "projects.filter.inProgress", countKey: "inProgress" },
  { value: ProjectFilter.COMPLETED, labelKey: "projects.filter.completed", countKey: "completed" },
  { value: ProjectFilter.OVERDUE, labelKey: "projects.filter.overdue", countKey: "overdue" },
]

interface FilterButtonProps {
  option: FilterOption
  isActive: boolean
  count: number
  onSelect: (value: ProjectFilter) => void
}

function FilterButton({ option, isActive, count, onSelect }: FilterButtonProps) {
  const { t } = useTranslation()

  function handleClick() {
    onSelect(option.value)
  }

  return (
    <button type="button" onClick={handleClick} className={filterButton({ active: isActive })}>
      {t(option.labelKey)}
      <span className={filterBadge({ active: isActive })}>{count}</span>
    </button>
  )
}

interface ProjectsFilterProps {
  search: string
  onSearch: (value: string) => void
  filter: ProjectFilter
  onFilter: (value: ProjectFilter) => void
  stats: ProjectStats
}

export function ProjectsFilter({ search, onSearch, filter, onFilter, stats }: ProjectsFilterProps) {
  const { t } = useTranslation()

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    onSearch(e.target.value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
        />
        <input
          type="text"
          placeholder={t("projects.filter.search")}
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="w-full sm:w-auto overflow-x-auto flex items-center gap-1 bg-surface-container border border-outline-variant p-1 rounded-xl">
        {FILTER_OPTIONS.map((option) => (
          <FilterButton
            key={option.value}
            option={option}
            isActive={filter === option.value}
            count={stats[option.countKey]}
            onSelect={onFilter}
          />
        ))}
      </div>
    </div>
  )
}
