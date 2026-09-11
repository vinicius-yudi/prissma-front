import { Check, History, RotateCcw, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Hatch } from "@/shared/components/ui/hatch/Hatch"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { formatDate } from "@/shared/utils/formatters"

import { useProposalImage } from "../hooks/useProposalImage"
import { useProposta, usePropostas } from "../hooks/usePropostas"
import type { Proposal, ProposalStatus, ProposalVersion } from "../types/proposal"
import { PropostaStatusBadge } from "./PropostaStatusBadge"

interface VersaoRowProps {
  projectId: number
  proposalId: number
  version: ProposalVersion
  canMutate: boolean
  isBusy: boolean
  onChangeStatus: (versionId: number, status: ProposalStatus) => void
}

function VersaoRow({
  projectId,
  proposalId,
  version,
  canMutate,
  isBusy,
  onChangeStatus,
}: VersaoRowProps) {
  const { t } = useTranslation()
  const { url } = useProposalImage(projectId, proposalId, version.id, version.hasImage)

  const isApproved = version.status === "APPROVED"
  const isRejected = version.status === "REJECTED"

  return (
    <li className="flex gap-3.5 border-b border-outline-variant py-3.5 last:border-b-0">
      <div className="size-16 shrink-0 overflow-hidden rounded-lg">
        {url ? (
          <img
            src={url}
            alt={t("obra.propostas.versions.thumbAlt", { version: version.version })}
            className="size-full object-cover"
          />
        ) : (
          <Hatch className="size-full rounded-lg" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Num className="text-[13px] font-semibold text-on-surface">v{version.version}</Num>
          <PropostaStatusBadge status={version.status} />
          {version.generatedByAi && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-bright">
              <Sparkles size={11} strokeWidth={2} />
              {t("obra.propostas.aiBadge")}
            </span>
          )}
        </div>

        {version.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
            {version.description}
          </p>
        )}

        <p className="text-[11px] text-on-surface-faint">
          {version.authorName} · <Num>{formatDate(version.submittedAt)}</Num>
        </p>

        {canMutate && (
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isBusy || isApproved}
              onClick={() => onChangeStatus(version.id, "APPROVED")}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-outline hover:text-ok disabled:opacity-40"
            >
              <Check size={12} strokeWidth={2} />
              {t("obra.propostas.versions.approve")}
            </button>
            <button
              type="button"
              disabled={isBusy || isRejected}
              onClick={() => onChangeStatus(version.id, "REJECTED")}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-outline hover:text-warn disabled:opacity-40"
            >
              <RotateCcw size={12} strokeWidth={2} />
              {t("obra.propostas.versions.requestChanges")}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

interface VersoesPropostaProps {
  open: boolean
  onClose: () => void
  projectId: number
  /** Null enquanto nenhum card foi escolhido — o modal não abre nesse estado. */
  proposal: Proposal | null
  canMutate: boolean
}

/**
 * Histórico de versões da proposta (Telas §19).
 *
 * Busca o detalhe em vez de usar o card: a listagem só carrega a versão mais
 * recente, de propósito — trazer todas as versões de todas as propostas para
 * desenhar a grade seria um N+1 a cada abertura da tela.
 *
 * A aprovação é **por versão**, não por proposta: é comum a v1 ser rejeitada e
 * a v2 aprovada, e o card mostra o status da versão atual.
 */
export function VersoesProposta({
  open,
  onClose,
  projectId,
  proposal,
  canMutate,
}: VersoesPropostaProps) {
  const { t } = useTranslation()
  const [pendingVersionId, setPendingVersionId] = useState<number | null>(null)
  const { data, isLoading, isError } = useProposta(projectId, open ? (proposal?.id ?? null) : null)
  const { changeStatus, isChangingStatus } = usePropostas(projectId)

  if (!proposal) return null
  // Alias após a guarda: o narrowing de `proposal` não atravessa as funções
  // declaradas abaixo, e o TS voltaria a vê-lo como anulável dentro delas.
  const current = proposal

  // Enquanto o detalhe não chega, a versão que o card já conhece evita que o
  // modal abra vazio.
  const versions = data?.versions ?? (proposal.latestVersion ? [proposal.latestVersion] : [])

  function handleChangeStatus(versionId: number, status: ProposalStatus) {
    setPendingVersionId(versionId)
    changeStatus(
      { proposalId: current.id, versionId, status },
      { onSettled: () => setPendingVersionId(null) },
    )
  }

  function renderBody() {
    if (isLoading) {
      return (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </ul>
      )
    }

    if (isError) {
      return (
        <p className="py-8 text-center text-sm text-on-surface-variant">{t("obra.acompError")}</p>
      )
    }

    if (versions.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-on-surface-variant">
          {t("obra.propostas.versions.empty")}
        </p>
      )
    }

    return (
      <ul>
        {/* Mais recente primeiro: é a que o usuário veio olhar. */}
        {[...versions]
          .sort((a, b) => b.version - a.version)
          .map((version) => (
            <VersaoRow
              key={version.id}
              projectId={projectId}
              proposalId={current.id}
              version={version}
              canMutate={canMutate}
              isBusy={isChangingStatus && pendingVersionId === version.id}
              onChangeStatus={handleChangeStatus}
            />
          ))}
      </ul>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.versions.title")}
      description={proposal.title}
      icon={<History size={18} />}
      size="xl"
    >
      <div className="px-6 pb-6">
        {renderBody()}

        <div className="mt-5 flex justify-end border-t border-outline-variant pt-5">
          <Button type="button" variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.propostas.actions.close")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
