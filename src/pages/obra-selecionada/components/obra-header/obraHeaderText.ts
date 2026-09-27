import type { Pace, PaceTone } from "../../hooks/useObraHeader"

/** Tipo de projeto do backend → chave do rótulo. */
export const PROJECT_TYPE_KEY: Record<string, string> = {
  RESIDENTIAL: "registerWork.typeResidential",
  COMMERCIAL: "registerWork.typeCommercial",
  INDUSTRIAL: "registerWork.typeIndustrial",
}

export const CATEGORY_KEY: Record<string, string> = {
  BUILDING: "registerWork.categoryBuilding",
  RENOVATION: "registerWork.categoryRenovation",
}

const PACE_KEY: Record<PaceTone, string> = {
  onTrack: "obra.header.pace.onTrack",
  ahead: "obra.header.pace.ahead",
  behind: "obra.header.pace.behind",
  late: "obra.header.pace.behind",
}

export function paceKey(pace: Pace): string {
  return PACE_KEY[pace.tone]
}
