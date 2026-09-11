import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ProposalRequestError, getPreview, requestPreview } from "../services/propostas.service"
import type { PreviewOptions } from "../types/proposal"
import { propostasQueryKey } from "./usePropostas"

/** De quanto em quanto tempo a tela pergunta se a IA terminou. */
export const POLL_INTERVAL_MS = 3000

interface StartInput {
  proposalId: number
  rawImage: File
  floorPlan: File | null
  options: PreviewOptions
}

/**
 * Prévia visual por IA — disparo e acompanhamento.
 *
 * O servidor responde 202 e trabalha por 30 a 60s, então a tela pergunta o
 * status de tempos em tempos. Quem faz isso é o próprio TanStack, pelo
 * `refetchInterval`: um `setInterval` à mão sobreviveria ao desmonte e
 * continuaria batendo na API depois que o usuário saísse da tela.
 */
export function usePreviaIA(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [job, setJob] = useState<{ proposalId: number; previewId: number } | null>(null)
  // Evita repetir o toast: o polling continua entregando o mesmo dado READY
  // até a query ser desativada.
  const announced = useRef<number | null>(null)

  const startMutation = useMutation({
    mutationFn: ({ proposalId, rawImage, floorPlan, options }: StartInput) =>
      requestPreview(projectId, proposalId, rawImage, floorPlan, options),
    onSuccess: (preview) => {
      announced.current = null
      setJob({ proposalId: preview.proposalId, previewId: preview.id })
    },
    onError: (error: Error) => {
      if (error instanceof ProposalRequestError && error.status === 415) {
        toast.error(t("obra.propostas.unsupportedType"))
        return
      }
      toast.error(error.message || t("obra.propostas.toasts.previewError"))
    },
  })

  const statusQuery = useQuery({
    queryKey: ["previa-ia", projectId, job?.previewId],
    queryFn: () => getPreview(projectId, job!.proposalId, job!.previewId),
    enabled: !!job,
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? POLL_INTERVAL_MS : false,
  })

  const preview = statusQuery.data ?? null

  useEffect(() => {
    if (!preview || preview.status === "PROCESSING") return
    if (announced.current === preview.id) return
    announced.current = preview.id

    if (preview.status === "READY") {
      queryClient.invalidateQueries({ queryKey: propostasQueryKey(projectId) })
      // O histórico de versões vive na chave do detalhe — a versão recém-gerada
      // só aparece nele com esta segunda invalidação.
      queryClient.invalidateQueries({ queryKey: ["proposta", projectId] })
      toast.success(t("obra.propostas.toasts.previewSuccess"))
    } else {
      toast.error(preview.errorMessage || t("obra.propostas.toasts.previewError"))
    }
  }, [preview, projectId, queryClient, t])

  function reset() {
    announced.current = null
    setJob(null)
  }

  return {
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    preview,
    /** Verdadeiro do disparo até a IA responder — é o estado de loading longo. */
    isProcessing: startMutation.isPending || preview?.status === "PROCESSING",
    isFailed: preview?.status === "FAILED",
    errorMessage: preview?.errorMessage ?? null,
    activeProposalId: job?.proposalId ?? null,
    reset,
  }
}
