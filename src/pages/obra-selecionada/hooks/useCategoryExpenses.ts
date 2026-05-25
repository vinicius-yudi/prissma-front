import { useQuery } from "@tanstack/react-query"

import { listExpenses } from "../services/budget.service"

export function useCategoryExpenses(itemId: number, enabled: boolean) {
  const query = useQuery({
    queryKey: ["budget", "item", itemId, "expenses"],
    queryFn: () => listExpenses(itemId),
    enabled,
  })

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
  }
}
