import { FolderOpen, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"

import { ProjectCard } from "./components/ProjectCard"
import { ProjectsFilter } from "./components/ProjectsFilter"
import { useProjects } from "./hooks/useProjects"

const PAGE_TITLE = "Projetos"
const PAGE_SUBTITLE = "Gerencie todos os seus projetos"
const NEW_PROJECT_LABEL = "Novo Projeto"
const EMPTY_TITLE = "Nenhum projeto encontrado"
const EMPTY_HINT = "Ajuste os filtros ou crie um novo projeto"
const ERROR_TITLE = "Erro ao carregar projetos"
const ERROR_HINT = "Tente novamente mais tarde"
const LOADING_TEXT = "Carregando projetos..."

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-on-surface-variant text-sm">{LOADING_TEXT}</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-1">
      <p className="text-on-surface font-medium">{ERROR_TITLE}</p>
      <p className="text-on-surface-variant text-sm">{ERROR_HINT}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-5 rounded-2xl bg-white/5 border border-white/8">
        <FolderOpen size={36} className="text-on-surface-variant" />
      </div>
      <div className="text-center">
        <p className="text-on-surface font-medium">{EMPTY_TITLE}</p>
        <p className="text-on-surface-variant text-sm mt-1">{EMPTY_HINT}</p>
      </div>
    </div>
  )
}

export function ProjetosPage() {
  const { projects, isLoading, isError, search, setSearch, filter, setFilter, stats } =
    useProjects()
  const navigate = useNavigate()

  function handleNewProject() {
    navigate("/cadastroObra")
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{PAGE_TITLE}</h1>
          <p className="text-sm text-on-surface-variant">{PAGE_SUBTITLE}</p>
        </div>
        <Button onClick={handleNewProject} className="w-auto px-5 py-2.5 text-sm shrink-0">
          <Plus size={15} />
          {NEW_PROJECT_LABEL}
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
