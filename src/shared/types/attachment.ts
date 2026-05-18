export interface Attachment {
  id: number
  constructionProjectId: number
  stageId: number | null
  taskId: number | null
  uploadedByUserId: number
  fileName: string
  fileType: string
  uploadedAt: string
}
