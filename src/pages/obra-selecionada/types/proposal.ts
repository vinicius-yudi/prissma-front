/**
 * Propostas / Design & IA (Telas §19).
 *
 * Os literais espelham os enums do backend — mandar qualquer outra string faz o
 * servidor responder 400.
 */

export const PROPOSAL_STATUS = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const
export type ProposalStatus = (typeof PROPOSAL_STATUS)[number]

export const PREVIEW_STATUS = ["PROCESSING", "READY", "FAILED"] as const
export type PreviewStatus = (typeof PREVIEW_STATUS)[number]

export const ENVIRONMENT_TYPES = [
  "LIVING_ROOM",
  "BEDROOM",
  "KITCHEN",
  "BATHROOM",
  "DINING_ROOM",
  "OFFICE",
  "BALCONY",
  "GARAGE",
  "OTHER",
] as const
export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[number]

export const DESIGN_STYLES = [
  "MODERN",
  "MINIMALIST",
  "CONTEMPORARY",
  "INDUSTRIAL",
  "CLASSIC",
  "RUSTIC",
] as const
export type DesignStyle = (typeof DESIGN_STYLES)[number]

export const COLOR_PALETTE = [
  "WHITE",
  "OFF_WHITE",
  "BEIGE",
  "LIGHT_GRAY",
  "DARK_GRAY",
  "BLACK",
  "NATURAL_WOOD",
  "DARK_WOOD",
  "GREEN",
  "BLUE",
] as const
export type ColorPalette = (typeof COLOR_PALETTE)[number]

export const LIGHTING = [
  "NATURAL",
  "WARM",
  "COOL",
  "NEUTRAL",
  "WARM_INDIRECT",
  "COOL_INDIRECT",
] as const
export type Lighting = (typeof LIGHTING)[number]

export const FLOORING = [
  "LIGHT_PORCELAIN",
  "DARK_PORCELAIN",
  "WOOD",
  "LAMINATE",
  "MARBLE",
  "POLISHED_CONCRETE",
  "CERAMIC",
] as const
export type Flooring = (typeof FLOORING)[number]

export interface ProposalVersion {
  id: number
  version: number
  status: ProposalStatus
  description: string | null
  authorUserId: number | null
  authorName: string
  generatedByAi: boolean
  /** Diz se vale buscar a imagem: sem isso o card desenha a hachura. */
  hasImage: boolean
  fileName: string | null
  fileType: string | null
  submittedAt: string
  updatedAt: string
}

export interface Proposal {
  id: number
  constructionProjectId: number
  stageId: number | null
  title: string
  description: string | null
  environmentType: EnvironmentType
  createdByUserId: number | null
  createdByName: string
  latestVersion: ProposalVersion | null
  versionCount: number
  /** Só vem preenchido no detalhe; na listagem é `null`. */
  versions: ProposalVersion[] | null
  createdAt: string
  updatedAt: string
}

export interface ProposalPage {
  content: Proposal[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ProposalPayload {
  title: string
  description?: string | null
  environmentType: EnvironmentType
  stageId?: number | null
}

export interface PreviewJob {
  id: number
  proposalId: number
  status: PreviewStatus
  /** Preenchido quando o status vira READY. */
  versionId: number | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

/** Os sete campos que o prompt da IA consome. */
export interface PreviewOptions {
  environment: EnvironmentType
  style: DesignStyle
  colors: ColorPalette[]
  lighting: Lighting
  flooring: Flooring
  generationMode: "PREVIEW" | "FINAL"
  additionalInstructions?: string
}
