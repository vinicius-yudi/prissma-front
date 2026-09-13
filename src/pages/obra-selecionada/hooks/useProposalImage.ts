import { useQuery } from "@tanstack/react-query"

import { fetchVersionImage } from "../services/propostas.service"
import { blobToDataUrl } from "../utils/blobToDataUrl"

/**
 * URL local da imagem de uma versão.
 *
 * A rota da imagem é autenticada e o `<img>` não manda header nenhum, então o
 * caminho é buscar o binário e transformar em URL.
 *
 * O blob vem por query, não por `useEffect` + `useState`: a grade remonta os
 * cards a cada invalidação (e são várias, com o polling da prévia rodando), e
 * sem cache cada remontagem baixaria a imagem de novo. `staleTime: Infinity`
 * porque a imagem de uma versão é imutável — versão nova é outra linha, com
 * outra chave.
 *
 * A URL é `data:` e nasce dentro da query, de propósito. Com
 * `URL.createObjectURL` a URL precisa ser revogada, e revogar é onde isso
 * quebrava: criada na renderização e revogada na limpeza de um efeito, ela
 * morria assim que o blob já estava em cache na primeira renderização — o
 * StrictMode monta, desmonta e remonta, a limpeza revogava, e o `<img>` ficava
 * com uma URL morta. Era por isso que o histórico abria com as miniaturas
 * quebradas e voltava ao normal depois de um F5: página recém-carregada busca o
 * blob depois da montagem, e aí a ordem não se invertia.
 */
export function useProposalImage(
  projectId: number,
  proposalId: number,
  versionId: number | null,
  enabled: boolean,
): { url: string | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["proposta-imagem", projectId, proposalId, versionId],
    queryFn: async () => {
      const blob = await fetchVersionImage(projectId, proposalId, versionId as number)
      return blobToDataUrl(blob)
    },
    enabled: enabled && !!versionId && projectId > 0,
    staleTime: Infinity,
    // Thumbnail que não carrega cai na hachura, que já é o estado de "sem
    // imagem". Repetir a falha três vezes só atrasaria o card.
    retry: false,
  })

  return { url: data ?? null, isLoading: isLoading && enabled }
}
