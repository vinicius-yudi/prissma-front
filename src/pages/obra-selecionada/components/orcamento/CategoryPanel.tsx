import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import type { BudgetItem } from "@/shared/types/budget"

import { SectionCard } from "../visao-geral/SectionCard"
import { CategoryRow } from "./CategoryRow"

interface CategoryPanelProps {
  items: BudgetItem[]
  /** Categoria que filtra os lançamentos; `null` é "todas". */
  selectedId: number | null
  canMutate: boolean
  onSelect: (id: number | null) => void
  onCreate: () => void
  onEdit: (item: BudgetItem) => void
  onDelete: (item: BudgetItem) => void
}

/** "Por categoria": uma trena por categoria, com quantas passaram do planejado. */
export function CategoryPanel({ items, selectedId, canMutate, onSelect, onCreate, onEdit, onDelete }: CategoryPanelProps) {
  const { t } = useTranslation()
  const exceeded = items.filter((item) => item.exceeded).length

  return (
    <SectionCard
      title={t("obra.orcamento.category.title")}
      meta={exceeded > 0 ? <span className="font-[620] text-danger">{t("obra.orcamento.category.exceededCount", { count: exceeded })}</span> : undefined}
    >
      {items.length === 0 ? (
        <EmptyState
          title={t("obra.orcamento.category.noneTitle")}
          body={t("obra.orcamento.category.noneBody")}
          action={
            canMutate && (
              <Button variant="outline" fullWidth={false} onClick={onCreate}>
                <Plus size={15} />
                {t("obra.orcamento.actions.addCategory")}
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <CategoryRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              dimmed={selectedId !== null && selectedId !== item.id}
              canMutate={canMutate}
              onSelect={() => onSelect(selectedId === item.id ? null : item.id)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
