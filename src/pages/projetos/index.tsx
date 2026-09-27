import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { PageHeader } from "@/shared/components/ui/page-header/PageHeader"

import { ProjectsContent } from "./components/ProjectsContent"
import { ProjectStepModal } from "./components/ProjectStepModal"
import { ProjectsToolbar } from "./components/ProjectsToolbar"
import { useProjects } from "./hooks/useProjects"
import { ProjectFilter } from "./types"

/** Parâmetro que abre o cadastro de obra direto: `/obras?nova=1`. */
const NEW_PARAM = "nova"

/**
 * Obras (nível 1, DS v2): recorte, busca, ordenação e visualização na URL;
 * cards com a fachada e o avanço real de cada obra.
 */
export function ProjetosPage() {
  const { t } = useTranslation()
  const list = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  // Sidebar, barra superior e busca ⌘K abrem o cadastro por `?nova=1`: o
  // atalho funciona de qualquer tela sem o shell conhecer este modal.
  const [searchParams, setSearchParams] = useSearchParams()
  const isCreateOpen = createOpen || searchParams.get(NEW_PARAM) === "1"

  function openCreate() {
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    if (!searchParams.has(NEW_PARAM)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(NEW_PARAM)
        return next
      },
      { replace: true },
    )
  }

  // Antes de qualquer early return: alimenta a ação flutuante do celular.
  usePrimaryAction({ label: t("projects.newProject"), onClick: openCreate })

  const { stats, projects, search, filter, view } = list
  const isFiltered = Boolean(search) || filter !== ProjectFilter.ALL

  return (
    <div>
      <PageHeader
        title={t("projects.title")}
        subtitle={t("projects.summary", {
          inProgress: stats.inProgress,
          planning: stats.planning,
          completed: stats.completed,
        })}
        dimension={<DimensionLine measure={t("projects.dimensionTotal", { count: stats.total })}>{t("projects.dimensionLabel")}</DimensionLine>}
        actions={
          <Button fullWidth={false} onClick={openCreate} className="hidden lg:inline-flex">
            <Plus size={16} />
            {t("projects.newProject")}
          </Button>
        }
      />

      <ProjectsToolbar
        stats={stats}
        filter={filter}
        onFilter={list.setFilter}
        search={search}
        onSearch={list.setSearch}
        sort={list.sort}
        onSort={list.setSort}
        view={view}
        onView={list.setView}
      />

      <ProjectsContent
        projects={projects}
        view={view}
        search={search}
        isFiltered={isFiltered}
        isLoading={list.isLoading}
        isError={list.isError}
        onCreate={openCreate}
        onClearFilters={list.clearFilters}
      />

      <ProjectStepModal open={isCreateOpen} onClose={closeCreate} />
    </div>
  )
}
