import { Search } from "lucide-react"
import type { ChangeEvent } from "react"
import { tv } from "tailwind-variants"

import type { ProjectStats } from "../hooks/useProjects"
import { ProjectFilter } from "../types"

const SEARCH_PLACEHOLDER = "Buscar projetos..."

const filterButton = tv({
  base: "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
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
  label: string
  countKey: keyof ProjectStats
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: ProjectFilter.ALL, label: "Todos", countKey: "total" },
  { value: ProjectFilter.IN_PROGRESS, label: "Em Andamento", countKey: "inProgress" },
  { value: ProjectFilter.COMPLETED, label: "Concluídos", countKey: "completed" },
  { value: ProjectFilter.OVERDUE, label: "Atrasados", countKey: "overdue" },
]

interface FilterButtonProps {
  option: FilterOption
  isActive: boolean
  count: number
  onSelect: (value: ProjectFilter) => void
}

function FilterButton({ option, isActive, count, onSelect }: FilterButtonProps) {
  function handleClick() {
    onSelect(option.value)
  }

  return (
    <button onClick={handleClick} className={filterButton({ active: isActive })}>
      {option.label}
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
          placeholder={SEARCH_PLACEHOLDER}
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex items-center gap-1 bg-surface-container border border-outline-variant p-1 rounded-xl">
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
