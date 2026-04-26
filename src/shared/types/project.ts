export const ProjectStatus = {
  PLANNING: "PLANNING",
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

export interface Project {
  id: number
  title: string
  address: string
  projectType: string
  category: string
  landArea: number
  builtArea: number
  status: ProjectStatus
  plannedStartDate: string | null
  plannedEndDate: string | null
  createdAt: string
  updatedAt: string
}
