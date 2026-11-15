import { api } from "@/lib/api"
import type { Notification } from "@/shared/types/notification"

export function markNotificationAsRead(id: number): Promise<Notification> {
  return api.patch<Notification>(`/users/me/notifications/${id}/read`)
}