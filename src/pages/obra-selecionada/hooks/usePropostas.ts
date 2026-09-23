import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
  isImageMime,
} from "@/shared/constants/attachments"

import {
  ProposalRequestError,
  addProposalVersion,
  changeVersionStatus,
  createProposal,
  deleteProposal,
  getProposal,
  listProposals,
  updateProposal,
} from "../services/propostas.service"
import type { Proposal, ProposalPayload, ProposalStatus } from "../types/proposal"

export function propostasQueryKey(projectId: number) {
  return ["propostas", projectId]
}

/**
 * Chave do detalhe. Separada da listagem porque só o detalhe traz `versions` —
 * a lista devolve apenas a versão mais recente, para o card não pagar N+1.
 */
export function propostaQueryKey(projectId: number, proposalId: number) {
  return ["proposta", projectId, proposalId]
}

/** Proposta com o histórico completo de versões. Alimenta o modal de versões. */
export function useProposta(projectId: number, proposalId: number | null) {
  return useQuery({
    queryKey: propostaQueryKey(projectId, proposalId ?? 0),
    queryFn: () => getProposal(projectId, proposalId as number),
    enabled: projectId > 0 && !!proposalId,
  })
}

interface CreateInput {
  payload: ProposalPayload
  file?: File | null
}

interface VersionInput {
  proposalId: number
  file: File
  description?: string
}

interface StatusInput {
  proposalId: number
  versionId: number
  status: ProposalStatus
  comment?: string
}

/**
 * Propostas da obra.
 *
 * A validação de arquivo aqui é eco da do servidor — que checa tipo, tamanho e
 * os magic bytes. Existe só para o usuário saber na hora, sem gastar o upload.
 */
export function usePropostas(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = propostasQueryKey(projectId)

  const query = useQuery({
    queryKey,
    queryFn: () => listProposals(projectId),
    enabled: projectId > 0,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
    // O modal de versões lê o detalhe, que é outra chave: sem isto o histórico
    // continuaria mostrando o estado anterior depois de aprovar uma versão.
    queryClient.invalidateQueries({ queryKey: ["proposta", projectId] })
  }

  function reportError(error: Error, fallback: string) {
    if (error instanceof ProposalRequestError) {
      if (error.status === 413) {
        toast.error(t("obra.attachments.fileTooLarge", { max: MAX_ATTACHMENT_SIZE_MB }))
        return
      }
      if (error.status === 415) {
        toast.error(t("obra.attachments.mimeMismatch"))
        return
      }
    }
    toast.error(error.message || fallback)
  }

  const createMutation = useMutation({
    mutationFn: ({ payload, file }: CreateInput) => createProposal(projectId, payload, file),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.propostas.toasts.createSuccess"))
    },
    onError: (error: Error) => reportError(error, t("obra.propostas.toasts.createError")),
  })

  const updateMutation = useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: number; payload: ProposalPayload }) =>
      updateProposal(projectId, proposalId, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.propostas.toasts.updateSuccess"))
    },
    onError: (error: Error) => reportError(error, t("obra.propostas.toasts.updateError")),
  })

  const deleteMutation = useMutation({
    mutationFn: (proposalId: number) => deleteProposal(projectId, proposalId),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.propostas.toasts.deleteSuccess"))
    },
    onError: (error: Error) => reportError(error, t("obra.propostas.toasts.deleteError")),
  })

  const versionMutation = useMutation({
    mutationFn: ({ proposalId, file, description }: VersionInput) =>
      addProposalVersion(projectId, proposalId, file, description),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.propostas.toasts.versionSuccess"))
    },
    onError: (error: Error) => reportError(error, t("obra.propostas.toasts.versionError")),
  })

  const statusMutation = useMutation({
    mutationFn: ({ proposalId, versionId, status, comment }: StatusInput) =>
      changeVersionStatus(projectId, proposalId, versionId, status, comment),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.propostas.toasts.statusSuccess"))
    },
    onError: (error: Error) => reportError(error, t("obra.propostas.toasts.statusError")),
  })

  /** Valida antes de subir e devolve `false` quando o arquivo não presta. */
  function validateImage(file: File): boolean {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(t("obra.attachments.fileTooLarge", { max: MAX_ATTACHMENT_SIZE_MB }))
      return false
    }
    if (!isImageMime(file.type)) {
      toast.error(t("obra.propostas.unsupportedType"))
      return false
    }
    return true
  }

  const proposals: Proposal[] = query.data?.content ?? []

  return {
    proposals,
    isLoading: query.isLoading,
    error: query.error,
    validateImage,
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    addVersion: versionMutation.mutate,
    addVersionAsync: versionMutation.mutateAsync,
    isAddingVersion: versionMutation.isPending,
    changeStatus: statusMutation.mutate,
    isChangingStatus: statusMutation.isPending,
  }
}
