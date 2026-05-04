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
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
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

export function formatProjectAddress(project: Pick<Project, "address" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "zipCode">): string {
  if (project.street) {
    const parts = [project.street, project.number].filter(Boolean).join(", ")
    const complement = project.complement ? `, ${project.complement}` : ""
    const district = [project.neighborhood, project.city, project.state].filter(Boolean).join(" - ")
    const zip = project.zipCode ? `, ${project.zipCode.slice(0, 5)}-${project.zipCode.slice(5)}` : ""
    return `${parts}${complement} - ${district}${zip}`
  }
  return project.address ?? ""
}
