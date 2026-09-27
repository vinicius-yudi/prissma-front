import { HardHat, PackageCheck, OctagonAlert, Users, type LucideIcon } from "lucide-react"

import type { DiarioEntryType } from "../types/diario"

export const DIARY_TYPE = {
  OCCURRENCE: "OCCURRENCE",
  DELIVERY: "DELIVERY",
  WORKFORCE: "WORKFORCE",
  IMPEDIMENT: "IMPEDIMENT",
} as const satisfies Record<DiarioEntryType, DiarioEntryType>

/** Ordem do seletor e do filtro: o dia a dia primeiro, o impedimento por último. */
export const DIARY_TYPES: DiarioEntryType[] = [
  DIARY_TYPE.WORKFORCE,
  DIARY_TYPE.DELIVERY,
  DIARY_TYPE.OCCURRENCE,
  DIARY_TYPE.IMPEDIMENT,
]

export const DIARY_ICON: Record<DiarioEntryType, LucideIcon> = {
  WORKFORCE: Users,
  DELIVERY: PackageCheck,
  OCCURRENCE: HardHat,
  IMPEDIMENT: OctagonAlert,
}

/** Valor do filtro que mostra todos os tipos. */
export const ALL_TYPES = "all"
