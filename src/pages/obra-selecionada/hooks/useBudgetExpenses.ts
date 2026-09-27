import { useQuery } from "@tanstack/react-query"

import type { Expense } from "@/shared/types/budget"

import { listBudgetExpenses } from "../services/budget.service"

/**
 * Todos os lançamentos do orçamento. A chave fica sob `["budget", projectId]`
 * para que qualquer escrita de orçamento (que invalida esse prefixo) recarregue
 * a curva e a tabela junto com os totais.
 */
export function useBudgetExpenses(projectId: number, budgetId: number | null) {
  const query = useQuery({
    queryKey: ["budget", projectId, "expenses", budgetId],
    queryFn: () => listBudgetExpenses(budgetId as number),
    enabled: budgetId !== null,
  })

  return {
    expenses: query.data ?? ([] as Expense[]),
    isLoading: query.isLoading,
  }
}
