import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { markNotificationAsRead } from "@/shared/services/notification.service"
import { getMyProfile } from "@/shared/services/user.service"
import type { UserProfile } from "@/shared/types/user"

const profileKey = ["me"] as const

export function useNotifications() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: profileKey,
    queryFn: getMyProfile,
    refetchInterval: 60_000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: profileKey })
      const previous = queryClient.getQueryData<UserProfile>(profileKey)
      queryClient.setQueryData<UserProfile>(profileKey, (profile) => profile && ({
        ...profile,
        notifications: profile.notifications?.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      }))
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(profileKey, context.previous)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(profileKey, (profile) => profile && ({
        ...profile,
        notifications: profile.notifications?.map((notification) =>
          notification.id === updated.id ? updated : notification,
        ),
      }))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  })

  return {
    notifications: query.data?.notifications ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
  }
}