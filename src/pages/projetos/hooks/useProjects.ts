import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

import { SEARCH_PARAM } from "@/shared/constants/search"
import { ProjectStatus, type Project } from "@/shared/types/project"

import { listProjects } from "../services/projects.service"
import { ProjectFilter, ProjectSort, ProjectView } from "../types"

export interface ProjectStats {
  total: number
  inProgress: number
  planning: number
  completed: number
  overdue: number
}

/** Parâmetros de URL da lista (CLAUDE.md §8: o que a tela mostra mora na URL). */
const PARAM = {
  filter: "status",
  sort: "ordem",
  view: "vista",
} as const

function isProjectOverdue(project: Project): boolean {
  if (!project.plannedEndDate) return false
  if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CANCELLED) return false
  return new Date(project.plannedEndDate) < new Date()
}

const MATCHES: Record<ProjectFilter, (project: Project) => boolean> = {
  [ProjectFilter.ALL]: () => true,
  [ProjectFilter.IN_PROGRESS]: (p) => p.status === ProjectStatus.IN_PROGRESS,
  [ProjectFilter.PLANNING]: (p) => p.status === ProjectStatus.PLANNING,
  [ProjectFilter.COMPLETED]: (p) => p.status === ProjectStatus.COMPLETED,
  [ProjectFilter.OVERDUE]: isProjectOverdue,
}

// Sem prazo vai para o fim da ordenação por prazo, não para o começo.
const FAR_FUTURE = "9999-12-31"

const COMPARE: Record<ProjectSort, (a: Project, b: Project) => number> = {
  [ProjectSort.RECENT]: (a, b) => b.createdAt.localeCompare(a.createdAt),
  [ProjectSort.DEADLINE]: (a, b) =>
    (a.plannedEndDate ?? FAR_FUTURE).localeCompare(b.plannedEndDate ?? FAR_FUTURE),
  [ProjectSort.NAME]: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
}

/** Sem acento e em minúsculas: "merces" encontra "Mercês". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function oneOf<T extends string>(values: Record<string, T>, raw: string | null, fallback: T): T {
  return Object.values(values).find((value) => value === raw) ?? fallback
}

export function useProjects() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get(SEARCH_PARAM) ?? ""
  const filter = oneOf(ProjectFilter, searchParams.get(PARAM.filter), ProjectFilter.ALL)
  const sort = oneOf(ProjectSort, searchParams.get(PARAM.sort), ProjectSort.RECENT)
  const view = oneOf(ProjectView, searchParams.get(PARAM.view), ProjectView.GRID)

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  const allProjects = query.data ?? []

  const stats: ProjectStats = {
    total: allProjects.length,
    inProgress: allProjects.filter(MATCHES[ProjectFilter.IN_PROGRESS]).length,
    planning: allProjects.filter(MATCHES[ProjectFilter.PLANNING]).length,
    completed: allProjects.filter(MATCHES[ProjectFilter.COMPLETED]).length,
    overdue: allProjects.filter(isProjectOverdue).length,
  }

  const term = normalize(search.trim())
  const projects = allProjects
    .filter(MATCHES[filter])
    .filter((p) => !term || normalize(`${p.title} ${p.address}`).includes(term))
    .sort(COMPARE[sort])

  /** Escreve um parâmetro; o valor padrão sai da URL em vez de virar `?status=ALL`. */
  function setParam(key: string, value: string, fallback: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== fallback) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  /**
   * Limpa busca e recorte numa escrita só: duas chamadas seguidas ao
   * `setSearchParams` partem da mesma URL, e a segunda desfaria a primeira.
   */
  function clearFilters() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(SEARCH_PARAM)
        next.delete(PARAM.filter)
        return next
      },
      { replace: true },
    )
  }

  return {
    projects,
    clearFilters,
    isLoading: query.isLoading,
    isError: query.isError,
    search,
    setSearch: (value: string) => setParam(SEARCH_PARAM, value, ""),
    filter,
    setFilter: (value: ProjectFilter) => setParam(PARAM.filter, value, ProjectFilter.ALL),
    sort,
    setSort: (value: ProjectSort) => setParam(PARAM.sort, value, ProjectSort.RECENT),
    view,
    setView: (value: ProjectView) => setParam(PARAM.view, value, ProjectView.GRID),
    stats,
  }
}
