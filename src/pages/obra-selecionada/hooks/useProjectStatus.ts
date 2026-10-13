import { createElement } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { updateProject } from "@/pages/projetos/services/projects.service"
import { ToastMessage } from "@/shared/components/ui/toast/ToastMessage"
import type { ProjectStatus } from "@/shared/types/project"

interface ChangeStatusInput {
  status: ProjectStatus
  /** Status de antes — é o que o Desfazer restaura. `null` na própria volta. */
  previous: ProjectStatus | null
}

/**
 * Troca o status da obra pelo menu do cabeçalho. O backend aceita PATCH
 * parcial, então só o status vai. Toda mudança gera toast com Desfazer (DS v2:
 * "toda ação volta atrás"); desfazer não gera um segundo Desfazer.
 */
export function useProjectStatus(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ status }: ChangeStatusInput) => updateProject(projectId, { status }),
    onSuccess: (_project, { status, previous }) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })

      const title = t("obra.header.statusChanged", { status: t(`status.${status}`).toLowerCase() })
      if (!previous) {
        toast.success(title)
        return
      }
      toast.success(
        createElement(ToastMessage, {
          title,
          action: {
            label: t("common.undo"),
            onClick: () => mutation.mutate({ status: previous, previous: null }),
          },
        }),
        { autoClose: 6000 },
      )
    },
    onError: (error: Error) => toast.error(error.message || t("obra.header.statusError")),
  })

  return {
    changeStatus: (status: ProjectStatus, previous: ProjectStatus) => mutation.mutate({ status, previous }),
    isChanging: mutation.isPending,
  }
}
