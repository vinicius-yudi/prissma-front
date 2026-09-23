import type { EtapaStatus } from "@/pages/projetos/types"

/**
 * Ordem das seções da lista de etapas (Telas §12).
 *
 * Mesma lógica do kanban de tarefas: segue o fluxo da obra, com "bloqueada"
 * por último porque é desvio, não passo do caminho.
 */
export const STAGE_SECTIONS: EtapaStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED"]

const SECTION_PREFIX = "section:"

/** Id do droppable de uma seção — distinto dos ids numéricos das etapas. */
export function sectionDroppableId(status: EtapaStatus): string {
  return `${SECTION_PREFIX}${status}`
}

/** Status de uma seção a partir do id do droppable; `null` se for uma etapa. */
export function sectionStatusFromId(id: string | number): EtapaStatus | null {
  if (typeof id !== "string" || !id.startsWith(SECTION_PREFIX)) return null
  const status = id.slice(SECTION_PREFIX.length) as EtapaStatus
  return STAGE_SECTIONS.includes(status) ? status : null
}
