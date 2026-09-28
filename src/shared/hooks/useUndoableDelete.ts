import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { createElement } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ToastMessage } from "@/shared/components/ui/toast/ToastMessage"

/** Janela do Desfazer — o mesmo tempo que o toast fica na tela (DS v2). */
export const UNDO_WINDOW_MS = 6000

interface UseUndoableDeleteOptions<TItem, TData> {
  /** Cache onde o item aparece (pode depender dele); sai dele na hora. */
  queryKey: (item: TItem) => QueryKey
  /** Devolve o cache sem o item. */
  removeFrom: (data: TData, item: TItem) => TData
  /** A exclusão de verdade, chamada quando a janela fecha sem Desfazer. */
  commit: (item: TItem) => Promise<unknown>
  /** Outras chaves que dependem da exclusão (totais, contagens). */
  alsoInvalidate?: (item: TItem) => QueryKey[]
  /** Título e corpo do toast. */
  describe: (item: TItem) => { title: string; body?: string }
  errorMessage: string
}

/**
 * Exclusão com Desfazer (DS v2: "toda ação volta atrás"). O item some da tela
 * na hora e a exclusão só vai ao servidor quando a janela de 6s fecha. Desfazer
 * cancela o envio e recarrega o cache — o item nunca saiu do servidor.
 *
 * O envio roda mesmo se a tela desmontar (a mutation segue no cache do
 * TanStack Query). Fechar a aba dentro da janela cancela a exclusão.
 */
export function useUndoableDelete<TItem, TData>(options: UseUndoableDeleteOptions<TItem, TData>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  function refresh(item: TItem) {
    for (const key of [options.queryKey(item), ...(options.alsoInvalidate?.(item) ?? [])]) {
      void queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const mutation = useMutation({
    mutationFn: options.commit,
    onError: (error: Error) => toast.error(error.message || options.errorMessage),
    onSettled: (_data, _error, item) => refresh(item),
  })

  return (item: TItem) => {
    const key = options.queryKey(item)
    const previous = queryClient.getQueryData<TData>(key)
    if (previous !== undefined) queryClient.setQueryData<TData>(key, options.removeFrom(previous, item))

    const timer = setTimeout(() => mutation.mutate(item), UNDO_WINDOW_MS)
    const { title, body } = options.describe(item)

    toast.success(
      createElement(ToastMessage, {
        title,
        body,
        action: {
          label: t("common.undo"),
          onClick: () => {
            clearTimeout(timer)
            if (previous !== undefined) queryClient.setQueryData(key, previous)
            refresh(item)
          },
        },
      }),
      { autoClose: UNDO_WINDOW_MS },
    )
  }
}
