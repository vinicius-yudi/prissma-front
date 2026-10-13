import { Plus, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import type { Proposal } from "../../types/proposal"
import { PropostaCard } from "./PropostaCard"

const LOADING = ["a", "b", "c"]

interface PropostasContentProps {
  projectId: number
  proposals: Proposal[]
  isLoading: boolean
  isError: boolean
  canMutate: boolean
  generatingId: number | null
  onRetry: () => void
  onCreate: () => void
  onGenerate: (proposal: Proposal) => void
  onHistory: (proposal: Proposal) => void
  onDelete: (proposal: Proposal) => void
}

/** Corpo de Propostas: carregando, erro, vazio ou a grade — um por vez. */
export function PropostasContent(props: PropostasContentProps) {
  const { t } = useTranslation()

  if (props.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {LOADING.map((key) => (
          <div key={key} className="h-80 animate-pulse rounded-lg bg-surface hairline" />
        ))}
      </div>
    )
  }

  if (props.isError) {
    return (
      <EmptyState
        title={t("obra.propostas.loadError")}
        action={
          <Button variant="outline" fullWidth={false} onClick={props.onRetry}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        }
      />
    )
  }

  if (props.proposals.length === 0) {
    return (
      <EmptyState
        icon={
          // Ambiente em planta, traço ouro — a ilustração de vazio desta tela.
          <svg width="56" height="42" viewBox="0 0 96 72" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 60V12h72v48H12z" />
            <path d="M12 34h30V12M42 60V46h42" />
            <path d="M58 22h16v12H58z" />
            <path d="M20 44h14v10H20z" strokeDasharray="3 4" />
          </svg>
        }
        title={t("obra.propostas.emptyTitle")}
        body={t("obra.propostas.emptyDescription")}
        action={
          props.canMutate && (
            <Button fullWidth={false} onClick={props.onCreate}>
              <Plus size={15} />
              {t("obra.propostas.actions.create")}
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {props.proposals.map((proposal) => (
        <PropostaCard
          key={proposal.id}
          projectId={props.projectId}
          proposal={proposal}
          canMutate={props.canMutate}
          isGenerating={props.generatingId === proposal.id}
          onGenerate={props.onGenerate}
          onHistory={props.onHistory}
          onDelete={props.onDelete}
        />
      ))}
    </div>
  )
}
