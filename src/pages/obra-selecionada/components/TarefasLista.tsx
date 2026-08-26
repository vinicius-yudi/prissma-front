import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatDate } from "@/shared/utils/formatters"
import { deriveStatus } from "@/shared/utils/status"

import type { TarefaComEtapa, TarefaPriority } from "../types/tarefas"

/**
 * Tarefas em lista, para o celular (Telas §13).
 *
 * O kanban não desce para telas estreitas: quatro colunas empilhadas viram
 * quatro listas que o usuário percorre no escuro, e o gesto de arrastar
 * compete com a rolagem da página. Aqui o recorte é por pílula e o status se
 * muda abrindo a tarefa — o mesmo formulário do desktop.
 */

const FILTERS = ["ALL", "IN_PROGRESS", "DONE", "LATE"] as const
type FilterKey = (typeof FILTERS)[number]

const pill = tv({
  base: "flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[11.5px] font-semibold transition-colors",
  variants: {
    active: {
      true: "bg-tint text-on-surface",
      false: "text-on-surface-variant",
    },
    tone: {
      default: "",
      danger: "text-danger",
    },
  },
})

const priorityPill = tv({
  base: "inline-flex shrink-0 items-center rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.06em]",
  variants: {
    priority: {
      HIGH: "bg-danger-bg text-danger",
      MEDIUM: "bg-warn-bg text-warn",
      LOW: "bg-tint text-on-surface-faint",
    },
  },
})

function isLate(item: TarefaComEtapa): boolean {
  return (
    deriveStatus({
      status: item.tarefa.status,
      plannedEndDate: item.tarefa.plannedEndDate,
    }).state === "late"
  )
}

interface TarefasListaProps {
  items: TarefaComEtapa[]
  onOpen: (item: TarefaComEtapa) => void
}

export function TarefasLista({ items, onOpen }: TarefasListaProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterKey>("ALL")

  const lateCount = useMemo(() => items.filter(isLate).length, [items])

  const visible = useMemo(() => {
    if (filter === "LATE") return items.filter(isLate)
    if (filter === "ALL") return items
    return items.filter((item) => item.tarefa.status === filter)
  }, [items, filter])

  function countFor(key: FilterKey): number | null {
    if (key === "ALL") return items.length
    if (key === "LATE") return lateCount
    return null
  }

  return (
    <div className="space-y-1">
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
        {FILTERS.map((key) => {
          const count = countFor(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={pill({
                active: filter === key,
                tone: key === "LATE" && lateCount > 0 ? "danger" : "default",
              })}
            >
              {t(`obra.tarefas.filters.${key}`)}
              {count !== null && count > 0 && <Num className="font-bold">· {count}</Num>}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-on-surface-variant">
          {t("obra.tarefas.emptyColumn")}
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {visible.map((item) => {
            const { tarefa } = item
            const late = isLate(item)
            const assignee = tarefa.assigneeName?.trim()

            return (
              <li key={tarefa.id}>
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-on-surface">
                        {tarefa.title}
                      </span>
                      {late && (
                        <span aria-hidden className="shrink-0 text-[11px] text-danger">
                          ⚠
                        </span>
                      )}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={tarefa.status}
                        plannedEndDate={tarefa.plannedEndDate}
                      />
                      <span className={priorityPill({ priority: tarefa.priority as TarefaPriority })}>
                        {t(`obra.tarefas.priority.${tarefa.priority}`)}
                      </span>
                      {tarefa.plannedEndDate && (
                        <Num
                          className={`text-[10.5px] ${late ? "text-danger" : "text-on-surface-faint"}`}
                        >
                          {formatDate(tarefa.plannedEndDate)}
                        </Num>
                      )}
                    </span>
                  </span>

                  <span
                    title={assignee ?? t("obra.tarefas.unassigned")}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container-high text-[9.5px] font-bold text-on-surface-variant"
                  >
                    {assignee ? assignee.slice(0, 2).toUpperCase() : "—"}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
