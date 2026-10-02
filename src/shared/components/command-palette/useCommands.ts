import { useQueryClient } from "@tanstack/react-query"
import { Building2, Layers, ListChecks, Moon, Plus, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useTheme } from "@/contexts/ThemeContext"
import { OBRA_NAV, WORKSPACE_NAV } from "@/shared/constants/nav"
import { SEARCH_PARAM } from "@/shared/constants/search"
import { useAccess } from "@/shared/hooks/useAccess"
import { useProjectList } from "@/shared/hooks/useProjectList"

import type { Command } from "./commandSearch"

/** O mínimo que a busca lê do cache de etapas e tarefas da obra aberta. */
interface CachedStage {
  id: number
  name: string
}

interface CachedTask {
  id: number
  title: string
}

/**
 * Comandos da busca ⌘K, montados a partir do que já está no cache do TanStack
 * Query — a busca não faz chamada nova. Etapas e tarefas só existem para a
 * obra aberta, e só se o usuário já passou pelo módulo que as carrega.
 */
export function useCommands(query: string, close: () => void): Command[] {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toggleTheme } = useTheme()
  const { levelOf, obraId } = useAccess()
  const projects = useProjectList()

  function go(to: string) {
    return () => {
      close()
      navigate(to)
    }
  }

  const actions: Command[] = []
  if (levelOf("obras") === "w") {
    actions.push({ id: "new", group: t("palette.groups.actions"), label: t("sidebar.newObra"), icon: Plus, run: go("/obras?nova=1") })
  }
  actions.push({
    id: "theme",
    group: t("palette.groups.actions"),
    label: t("palette.toggleTheme"),
    icon: Moon,
    run: () => {
      close()
      toggleTheme()
    },
  })
  if (query.trim()) {
    actions.push({
      id: "search-obras",
      group: t("palette.groups.actions"),
      label: t("palette.searchObras", { term: query.trim() }),
      icon: Search,
      run: go(`/obras?${SEARCH_PARAM}=${encodeURIComponent(query.trim())}`),
    })
  }

  const goTo: Command[] = [
    ...WORKSPACE_NAV.filter((item) => levelOf(item.module) !== "").map((item) => ({
      id: `nav-${item.module}`,
      group: t("palette.groups.goTo"),
      label: t(item.labelKey),
      icon: item.icon,
      run: go(item.path),
    })),
    ...(obraId === null
      ? []
      : OBRA_NAV.filter((item) => levelOf(item.module) !== "").map((item) => ({
          id: `obra-${item.module}`,
          group: t("palette.groups.goTo"),
          label: t(item.labelKey),
          icon: item.icon,
          run: go(`/obras/${obraId}/${item.path}`),
        }))),
  ]

  const obras: Command[] = projects.map((project) => ({
    id: `project-${project.id}`,
    group: t("palette.groups.obras"),
    label: project.title,
    hint: project.neighborhood ?? project.city ?? undefined,
    icon: Building2,
    run: go(`/obras/${project.id}`),
  }))

  const stages = obraId === null ? [] : (queryClient.getQueryData<CachedStage[]>(["stages", obraId]) ?? [])

  const etapas: Command[] = stages.map((stage) => ({
    id: `stage-${stage.id}`,
    group: t("palette.groups.stages"),
    label: stage.name,
    icon: Layers,
    run: go(`/obras/${obraId}/etapas`),
    searchOnly: true,
  }))

  const tarefas: Command[] = stages.flatMap((stage) =>
    (queryClient.getQueryData<CachedTask[]>(["tarefas", stage.id]) ?? []).map((task) => ({
      id: `task-${task.id}`,
      group: t("palette.groups.tasks"),
      label: task.title,
      hint: stage.name,
      icon: ListChecks,
      run: go(`/obras/${obraId}/tarefas`),
      searchOnly: true,
    })),
  )

  return [...actions, ...goTo, ...obras, ...etapas, ...tarefas]
}
