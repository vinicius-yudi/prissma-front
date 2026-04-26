import { FolderOpen, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"

import { ProjectCard } from "./components/ProjectCard"
import { ProjectsFilter } from "./components/ProjectsFilter"
import { useProjects } from "./hooks/useProjects"

function LoadingState() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-on-surface-variant text-sm">{t("projects.loading")}</p>
    </div>
  )
}

function ErrorState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-1">
      <p className="text-on-surface font-medium">{t("projects.errorTitle")}</p>
      <p className="text-on-surface-variant text-sm">{t("projects.errorHint")}</p>
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant">
        <FolderOpen size={36} className="text-on-surface-variant" />
      </div>
      <div className="text-center">
        <p className="text-on-surface font-medium">{t("projects.emptyTitle")}</p>
        <p className="text-on-surface-variant text-sm mt-1">{t("projects.emptyHint")}</p>
      </div>
    </div>
  )
}

export function ProjetosPage() {
  const { projects, isLoading, isError, search, setSearch, filter, setFilter, stats } =
    useProjects()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleNewProject() {
    navigate("/cadastroObra")
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("projects.title")}</h1>
          <p className="text-sm text-on-surface-variant">{t("projects.subtitle")}</p>
        </div>
        <Button onClick={handleNewProject} className="w-auto px-5 py-2.5 text-sm shrink-0">
          <Plus size={15} />
          {t("projects.newProject")}
        </Button>
      </div>

      <ProjectsFilter
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        stats={stats}
      />

      {projects.length === 0 && <EmptyState />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
