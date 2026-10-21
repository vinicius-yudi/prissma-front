import { LayoutGrid } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useProjectProgress } from "@/pages/projetos/hooks/useProjectProgress"
import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { useAccess } from "@/shared/hooks/useAccess"
import type { Project } from "@/shared/types/project"

import { useProjectBudgetQuery } from "../../hooks/useProjectBudgetQuery"
import { CustomizeBar } from "./layout/CustomizeBar"
import { hiddenFor, show, visibleFor } from "./layout/layoutModel"
import { useOverviewLayout } from "./layout/useOverviewLayout"
import { WidgetCatalog } from "./layout/WidgetCatalog"
import { WidgetGrid } from "./layout/WidgetGrid"
import { WIDGETS_BY_ID, type WidgetContext } from "./widgets/registry"

interface VisaoGeralProps {
  project: Project
}

/**
 * Visão geral da obra (DS v2), customizável. O cabeçalho grande (nome,
 * avanço, prazo, orçamento e fachada) já está acima, no <ObraHeader>; aqui
 * ficam os widgets — o que pede decisão, cronograma, etapa atual e os resumos
 * de cada módulo. Cada um leva ao módulo cheio, nenhum edita.
 *
 * Quais widgets aparecem, em que ordem e em que coluna é preferência do
 * usuário (salva no servidor, igual em todas as obras). Widget de módulo que
 * o perfil não acessa não aparece nem no catálogo.
 */
export function VisaoGeral({ project }: VisaoGeralProps) {
  const { t } = useTranslation()
  const { stages, currentStage } = useProjectProgress(project.id)
  const budget = useProjectBudgetQuery(project.id)
  const { canSee } = useAccess()
  const overview = useOverviewLayout()
  const [catalogOpen, setCatalogOpen] = useState(false)

  const canSeeWidget = (id: string) => {
    const definition = WIDGETS_BY_ID.get(id)
    return !!definition && canSee(definition.module)
  }
  const ctx: WidgetContext = { project, stages, currentStage, budget }
  const nothingVisible = visibleFor(overview.layout, canSeeWidget).length === 0

  function startAndAdd() {
    overview.startEditing()
    setCatalogOpen(true)
  }

  if (overview.isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]" aria-busy>
        <div className="h-72 animate-pulse rounded-lg bg-surface hairline" />
        <div className="h-72 animate-pulse rounded-lg bg-surface hairline" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomizeBar
        editing={overview.editing}
        dirty={overview.dirty}
        isSaving={overview.isSaving}
        onStart={overview.startEditing}
        onAdd={() => setCatalogOpen(true)}
        onRestore={overview.restoreDefault}
        onCancel={() => {
          setCatalogOpen(false)
          overview.cancel()
        }}
        onSave={() => {
          setCatalogOpen(false)
          void overview.save()
        }}
      />

      {nothingVisible && !overview.editing ? (
        <EmptyState
          icon={<LayoutGrid size={22} />}
          title={t("obra.visaoGeral.customize.emptyTitle")}
          body={t("obra.visaoGeral.customize.emptyBody")}
          action={
            <Button variant="outline" size="sm" fullWidth={false} onClick={startAndAdd}>
              {t("obra.visaoGeral.customize.add")}
            </Button>
          }
        />
      ) : (
        <WidgetGrid
          layout={overview.layout}
          ctx={ctx}
          editing={overview.editing}
          canSee={canSeeWidget}
          onChange={overview.apply}
        />
      )}

      <WidgetCatalog
        open={catalogOpen && overview.editing}
        hidden={hiddenFor(overview.layout, canSeeWidget)}
        onAdd={(id) => overview.apply((layout) => show(layout, id))}
        onClose={() => setCatalogOpen(false)}
      />
    </div>
  )
}
