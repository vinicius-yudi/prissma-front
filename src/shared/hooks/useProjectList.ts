import { useQuery } from "@tanstack/react-query"

import { listProjects } from "@/pages/projetos/services/projects.service"
import type { Project } from "@/shared/types/project"

/**
 * Lista de obras para o shell (sidebar e busca ⌘K).
 *
 * Mesma `queryKey` da tela de Obras: é o mesmo cache, então abrir o shell não
 * gera uma segunda chamada e criar uma obra atualiza os dois lugares. Não usa
 * o `useProjects` da página porque aquele filtra pelo termo de busca da URL —
 * a sidebar sumiria com as obras enquanto a lista estivesse filtrada.
 */
export function useProjectList(): Project[] {
  const { data } = useQuery({ queryKey: ["projects"], queryFn: listProjects })
  return data ?? []
}
