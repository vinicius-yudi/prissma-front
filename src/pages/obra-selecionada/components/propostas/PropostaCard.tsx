import { History, Sparkles, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { IconButton } from "@/shared/components/ui/icon-button/IconButton"

import { useProposalImage } from "../../hooks/useProposalImage"
import type { Proposal } from "../../types/proposal"
import { GeneratingBar } from "./GeneratingBar"
import { PropostaStatusBadge } from "./PropostaStatusBadge"

interface PropostaCardProps {
  projectId: number
  proposal: Proposal
  canMutate: boolean
  /** Verdadeiro só no card cuja prévia está sendo gerada agora. */
  isGenerating: boolean
  onGenerate: (proposal: Proposal) => void
  onHistory: (proposal: Proposal) => void
  onDelete: (proposal: Proposal) => void
}

/** A proposta pela versão mais recente: imagem, título, status e as ações. */
export function PropostaCard({ projectId, proposal, canMutate, isGenerating, onGenerate, onHistory, onDelete }: PropostaCardProps) {
  const { t } = useTranslation()
  const latest = proposal.latestVersion
  const { url, isLoading } = useProposalImage(projectId, proposal.id, latest?.id ?? null, !!latest?.hasImage)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-lg bg-surface p-4 hairline transition-shadow hover:shadow-soft"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md">
        {url ? (
          <img src={url} alt={t("obra.propostas.thumbAlt", { title: proposal.title })} className="size-full object-cover" />
        ) : (
          // Papel quadriculado = o espaço que ainda não foi desenhado (DS v2).
          <div className="blueprint flex size-full items-center justify-center bg-raised">
            <span className="px-4 text-center text-[12.5px] text-meta">
              {isLoading ? t("obra.propostas.loadingImage") : t("obra.propostas.noImage")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="t-section line-clamp-1 text-[16px] text-ink">{proposal.title}</h3>
          {latest && <span className="t-num flex-none text-[12.5px] font-[620] text-meta">v{latest.version}</span>}
        </div>
        {canMutate && (
          <IconButton label={t("obra.propostas.actions.delete")} onClick={() => onDelete(proposal)} className="-mt-1 -mr-1 size-8 hover:bg-danger-soft hover:text-danger">
            <Trash2 size={15} />
          </IconButton>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {latest && <PropostaStatusBadge status={latest.status} />}
        {latest?.generatedByAi && (
          <span className="inline-flex items-center gap-1 text-[12px] font-[620] text-gold-hi">
            <Sparkles size={12} />
            {t("obra.propostas.aiBadge")}
          </span>
        )}
      </div>

      {isGenerating ? (
        <div className="space-y-2">
          <GeneratingBar label={t("obra.propostas.generating")} />
          <p className="text-center text-[12.5px] text-ink-2">{t("obra.propostas.generating")}</p>
        </div>
      ) : (
        <Button variant="outline" size="sm" disabled={!canMutate} onClick={() => onGenerate(proposal)}>
          <Sparkles size={14} />
          {t("obra.propostas.generate")}
        </Button>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <button type="button" onClick={() => onHistory(proposal)} className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-[600] text-gold-hi hover:underline">
          <History size={13} />
          {t("obra.propostas.versions.history")}
        </button>
        <span className="t-num text-[12px] text-meta">{t("obra.propostas.versions.count", { count: proposal.versionCount })}</span>
      </div>
    </motion.article>
  )
}
