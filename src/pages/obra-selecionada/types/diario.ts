export type DiarioTag = "Ocorrência" | "Entrega" | "Impedimento"

export interface DiarioEntry {
  id: number
  constructionProjectId: number
  tag: DiarioTag
  text: string
  authorName: string
  createdAt: string
}

export interface CreateDiarioEntryRequest {
  tag: DiarioTag
  text: string
}