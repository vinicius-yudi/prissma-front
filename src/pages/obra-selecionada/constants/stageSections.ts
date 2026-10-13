import type { EtapaStatus } from "@/pages/projetos/types"

/**
 * Ordem dos status de etapa nos seletores: segue o fluxo da obra, com
 * "bloqueada" por último porque é desvio, não passo do caminho.
 */
export const STAGE_SECTIONS: EtapaStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED"]
