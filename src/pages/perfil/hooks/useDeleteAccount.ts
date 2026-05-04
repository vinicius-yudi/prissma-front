import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"

import { useAuth } from "@/contexts/AuthContext"
import { getMyProfile } from "@/shared/services/user.service"

import { deleteAccount } from "../services/perfil.service"

interface UseDeleteAccountOptions {
  onSuccess: () => void
}

export function useDeleteAccount({ onSuccess }: UseDeleteAccountOptions) {
  const { logout } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  })

  const mutation = useMutation({
    mutationFn: () => deleteAccount(profile!.id),
    onSuccess: () => {
      onSuccess()
      logout()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    handleDelete: mutation.mutate,
    isLoading: mutation.isPending,
  }
}
