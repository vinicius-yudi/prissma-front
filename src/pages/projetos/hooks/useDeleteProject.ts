import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { deleteProject } from "../services/projects.service"

interface UseDeleteProjectOptions {
  onSuccess?: () => void
}

export function useDeleteProject({ onSuccess }: UseDeleteProjectOptions = {}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success(t("projects.toasts.deleted"))
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || t("projects.toasts.deleteError"))
    },
  })

  return {
    handleDelete: (id: number) => mutation.mutate(id),
    isLoading: mutation.isPending,
  }
}
