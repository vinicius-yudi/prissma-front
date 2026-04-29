import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import { deleteProject } from "../services/projects.service"

interface UseDeleteProjectOptions {
  onSuccess?: () => void
}

export function useDeleteProject({ onSuccess }: UseDeleteProjectOptions = {}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Obra excluída com sucesso!")
      onSuccess?.()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Erro ao excluir obra"
      toast.error(message)
    },
  })

  return {
    handleDelete: (id: number) => mutation.mutate(id),
    isLoading: mutation.isPending,
  }
}
