import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"

import type { ProjectStats } from "../hooks/useProjects"
import { ProjectFilter } from "../types"

const filterButton = tv({
  base: "shrink-0 flex cursor-pointer items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
  variants: {
    active: {
      true: "bg-gold-grad text-on-primary shadow-glow",
      false: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high",
    },
  },
})

const filterBadge = tv({
  base: "text-[10.5px] px-1.5 py-0.5 rounded-full font-bold",
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
      <Num className={filterBadge({ active: isActive })}>{count}</Num>
    </button>
  )
}

interface ProjectsFilterProps {
  filter: ProjectFilter
  onFilter: (value: ProjectFilter) => void
  stats: ProjectStats
}

/**
 * Pílulas de recorte da lista. A busca por texto saiu daqui para o header —
 * ver <HeaderSearch>.
 */
export function ProjectsFilter({ filter, onFilter, stats }: ProjectsFilterProps) {
  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-outline-variant bg-surface-container-low p-1 sm:w-auto">
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
  )
}
