import { History } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { useProposta, usePropostas } from "../../hooks/usePropostas"
import type { Proposal, ProposalStatus } from "../../types/proposal"
import { VersoesList } from "./VersoesList"

interface VersoesPropostaProps {
  open: boolean
  onClose: () => void
  projectId: number
  /** Null enquanto nenhum card foi escolhido — o modal não abre nesse estado. */
  proposal: Proposal | null
  canMutate: boolean
}

/**
 * Histórico de versões (Telas §19). Busca o detalhe em vez de usar o card: a
 * listagem só traz a versão mais recente, de propósito — trazer todas de todas
 * as propostas seria um N+1 a cada abertura da tela.
 */
export function VersoesProposta({ open, onClose, projectId, proposal, canMutate }: VersoesPropostaProps) {
  const { t } = useTranslation()
  const [pendingVersionId, setPendingVersionId] = useState<number | null>(null)
  const { data, isLoading, isError } = useProposta(projectId, open ? (proposal?.id ?? null) : null)
  const { changeStatus, isChangingStatus } = usePropostas(projectId)

  if (!proposal) return null
  const proposalId = proposal.id
  // Enquanto o detalhe não chega, a versão que o card já conhece evita abrir vazio.
  const versions = data?.versions ?? (proposal.latestVersion ? [proposal.latestVersion] : [])

  function handleChangeStatus(versionId: number, status: ProposalStatus) {
    setPendingVersionId(versionId)
    changeStatus({ proposalId, versionId, status }, { onSettled: () => setPendingVersionId(null) })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.versions.title")}
      description={proposal.title}
      icon={<History size={18} />}
      size="xl"
      footer={
        <Button variant="outline" fullWidth={false} onClick={onClose}>
          {t("obra.propostas.actions.close")}
        </Button>
      }
    >
      <div className="px-6 pt-2 pb-4">
        <VersoesList
          projectId={projectId}
          proposalId={proposalId}
          versions={versions}
          isLoading={isLoading}
          isError={isError}
          canMutate={canMutate}
          busyVersionId={isChangingStatus ? pendingVersionId : null}
          onChangeStatus={handleChangeStatus}
        />
      </div>
    </Modal>
  )
}
