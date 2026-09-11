import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"

import { fetchVersionImage } from "../services/propostas.service"

/**
 * URL local da imagem de uma versão.
 *
 * A rota da imagem é autenticada e o `<img>` não manda header nenhum, então o
 * caminho é buscar o blob e criar uma URL de objeto.
 *
 * O blob vem por query, não por `useEffect` + `useState`: a grade remonta os
 * cards a cada invalidação (e são várias, com o polling da prévia rodando), e
 * sem cache cada remontagem baixaria a imagem de novo. `staleTime: Infinity`
 * porque a imagem de uma versão é imutável — versão nova é outra linha, com
 * outra chave.
 *
 * A URL de objeto é derivada do blob e revogada quando ele muda ou o card sai
 * de tela; sem isso o binário fica na memória da aba até o refresh.
 */
export function useProposalImage(
  projectId: number,
  proposalId: number,
  versionId: number | null,
  enabled: boolean,
): { url: string | null; isLoading: boolean } {
  const { data: blob, isLoading } = useQuery({
    queryKey: ["proposta-imagem", projectId, proposalId, versionId],
    queryFn: () => fetchVersionImage(projectId, proposalId, versionId as number),
    enabled: enabled && !!versionId && projectId > 0,
    staleTime: Infinity,
    // Thumbnail que não carrega cai na hachura, que já é o estado de "sem
    // imagem". Repetir a falha três vezes só atrasaria o card.
    retry: false,
  })

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  return { url, isLoading: isLoading && enabled }
}
