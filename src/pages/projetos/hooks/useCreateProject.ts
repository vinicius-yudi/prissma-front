import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import { createProject } from "../services/projects.service"

interface UseCreateProjectOptions {
  onSuccess?: () => void
}

export function useCreateProject({ onSuccess }: UseCreateProjectOptions = {}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Obra criada com sucesso!")
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar obra")
    },
  })

  return {
    handleCreate: mutation.mutate,
    isLoading: mutation.isPending,
  }
}
