import { Plus, Search } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Select } from "@/shared/components/ui/select/Select"

import type { UseTaskFiltersResult } from "../../hooks/useTaskFilters"
import type { Stage } from "../../services/stages.service"
import { hasActiveFilters } from "../../utils/taskFilters"
import { FilterChip } from "./FilterChip"

interface TaskToolbarProps {
  filterState: UseTaskFiltersResult
  stages: Stage[]
  lateCount: number
  visibleCount: number
  /** Ausente para quem não pode criar. */
  onCreate?: () => void
}

/** Busca, etapa, "minhas", "atrasadas" e limpar — tudo gravado na URL. */
export function TaskToolbar({ filterState, stages, lateCount, visibleCount, onCreate }: TaskToolbarProps) {
  const { t } = useTranslation()
  const { filters } = filterState

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="relative lg:w-64">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
        <span className="sr-only">{t("obra.tarefas.search")}</span>
        <Input
          type="search"
          value={filters.query}
          onChange={(event) => filterState.setQuery(event.target.value)}
          placeholder={t("obra.tarefas.search")}
          className="h-10 pl-9"
        />
      </label>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <Select
          aria-label={t("obra.tarefas.form.stage")}
          value={filters.stageId ?? ""}
          onChange={(event) => filterState.setStage(event.target.value ? Number(event.target.value) : null)}
          className="h-10 w-auto shrink-0"
        >
          <option value="">{t("obra.tarefas.allStages")}</option>
          {stages.map((stage, index) => (
            <option key={stage.id} value={stage.id}>
              {String(index + 1).padStart(2, "0")} · {stage.name}
            </option>
          ))}
        </Select>
        <FilterChip on={filters.mine} onClick={filterState.toggleMine}>
          {t("obra.tarefas.filters.mine")}
        </FilterChip>
        <FilterChip on={filters.onlyLate} onClick={filterState.toggleLate} tone="danger">
          {t("obra.tarefas.filters.LATE")} <span className="t-num">{lateCount}</span>
        </FilterChip>
        <AnimatePresence>
          {hasActiveFilters(filters) && (
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={filterState.clear}
              className="h-10 shrink-0 cursor-pointer px-2 text-[13px] font-[600] text-gold-hi hover:underline"
            >
              {t("obra.tarefas.filters.clear")}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 lg:ml-auto">
        <span className="t-num text-[13px] text-meta">{t("obra.tarefas.count", { count: visibleCount })}</span>
        {onCreate && (
          // No celular quem cria é a ação flutuante da barra.
          <Button size="sm" fullWidth={false} onClick={onCreate} className="hidden lg:inline-flex">
            <Plus size={15} />
            {t("obra.tarefas.newTask")}
          </Button>
        )}
      </div>
    </div>
  )
}
