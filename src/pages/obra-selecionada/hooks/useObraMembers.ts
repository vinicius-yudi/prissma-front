import { useQuery } from "@tanstack/react-query"

import { getEquipeMembers } from "../services/equipes.service"
import type { ConstructionProjectMember } from "../types/equipes"

/**
 * Membros vinculados à obra.
 *
 * A mesma consulta estava repetida em seis lugares — Pessoas, Visão geral,
 * formulário de tarefa, permissões, Equipes — cada um reescrevendo a chave
 * `["equipes", projectId]` à mão. Uma chave escrita errado num deles quebra
 * silenciosamente a invalidação de cache dos outros, então ela passa a viver
 * aqui.
 */

export function obraMembersKey(projectId: number) {
  return ["equipes", projectId] as const
}

interface UseObraMembersOptions {
  /** Desliga a consulta enquanto a tela não precisa dela (modal fechado). */
  enabled?: boolean
}

export function useObraMembers(projectId: number, { enabled = true }: UseObraMembersOptions = {}) {
  const query = useQuery<ConstructionProjectMember[]>({
    queryKey: obraMembersKey(projectId),
    queryFn: () => getEquipeMembers(projectId),
    enabled: enabled && projectId > 0,
  })

  return {
    members: query.data,
    /** Lista sempre iterável, para quem só precisa renderizar. */
    list: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
