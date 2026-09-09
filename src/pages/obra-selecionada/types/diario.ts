export type DiarioEntryType = "OCCURRENCE" | "DELIVERY" | "WORKFORCE" | "IMPEDIMENT"

export interface DiarioEntry {
  id: number
  constructionProjectId: number
  entryDate: string
  entryType: DiarioEntryType
  responsibleUserId: number | null
  responsibleName: string
  description: string
  attachmentId: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateDiarioEntryRequest {
  entryDate: string
  entryType: DiarioEntryType
  description: string
  attachmentId?: number | null
}

export interface DiarioPage {
  content: DiarioEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}