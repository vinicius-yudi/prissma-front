import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import { updateProject, type UpdateProjectPayload } from "../services/projects.service"

interface UseEditProjectOptions {
  onSuccess?: () => void
}

export function useEditProject({ onSuccess }: UseEditProjectOptions = {}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectPayload }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project"] })
      toast.success("Obra atualizada com sucesso!")
      onSuccess?.()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Erro ao atualizar obra"
      toast.error(message)
    },
  })

  return {
    handleEdit: (id: number, data: UpdateProjectPayload) => mutation.mutate({ id, data }),
    isLoading: mutation.isPending,
  }
}
