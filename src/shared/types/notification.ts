export type NotificationType = "TASK_ASSIGNED" | "INVITE_ACCEPTED" | "DIARY_ENTRY_CREATED"

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string | null
  read: boolean
  createdAt: string
}