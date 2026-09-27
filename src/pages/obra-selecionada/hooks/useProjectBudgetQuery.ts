import { useQuery } from "@tanstack/react-query"

import type { ProjectBudget } from "@/shared/types/budget"

import { getProjectBudget } from "../services/budget.service"

/**
 * Leitura do orçamento da obra, sem as mutations do `useBudget`. Mesma
 * `queryKey` do módulo de Orçamento: cabeçalho e Visão geral leem o mesmo
 * cache e se atualizam quando um lançamento entra.
 */
export function useProjectBudgetQuery(projectId: number): ProjectBudget | null {
  const { data } = useQuery({
    queryKey: ["budget", projectId],
    queryFn: () => getProjectBudget(projectId),
    enabled: projectId > 0,
    retry: false,
  })
  return data ?? null
}
