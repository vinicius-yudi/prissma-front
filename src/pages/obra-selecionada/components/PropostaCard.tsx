import { History, Sparkles, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Hatch } from "@/shared/components/ui/hatch/Hatch"
import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"

import { useProposalImage } from "../hooks/useProposalImage"
import type { Proposal } from "../types/proposal"
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

export function PropostaCard({
  projectId,
  proposal,
  canMutate,
  isGenerating,
  onGenerate,
  onHistory,
  onDelete,
}: PropostaCardProps) {
  const { t } = useTranslation()
  const latest = proposal.latestVersion

  const { url, isLoading } = useProposalImage(
    projectId,
    proposal.id,
    latest?.id ?? null,
    !!latest?.hasImage,
  )

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 transition-all duration-200 hover:border-outline">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
        {url ? (
          <img
            src={url}
            alt={t("obra.propostas.thumbAlt", { title: proposal.title })}
            className="size-full object-cover"
          />
        ) : (
          // Hachura = previsto/indisponível. É o vocabulário do sistema para
          // "ainda não existe", e evita um placeholder cinza genérico.
          <Hatch className="flex size-full items-center justify-center rounded-xl">
            <span className="px-4 text-center text-xs text-on-surface-faint">
              {isLoading ? t("obra.propostas.loadingImage") : t("obra.propostas.noImage")}
            </span>
          </Hatch>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="line-clamp-1 text-[17px] font-semibold leading-snug text-on-surface">
            {proposal.title}
          </h3>
          {latest && (
            <Num className="shrink-0 text-xs font-semibold text-on-surface-variant">
              v{latest.version}
            </Num>
          )}
        </div>
        {canMutate && (
          <button
            type="button"
            onClick={() => onDelete(proposal)}
            aria-label={t("obra.propostas.actions.delete")}
            title={t("obra.propostas.actions.delete")}
            className="shrink-0 rounded-lg p-1.5 text-on-surface-faint transition-colors hover:bg-surface-container hover:text-danger"
          >
            <Trash2 size={15} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {latest && <PropostaStatusBadge status={latest.status} />}
        {latest?.generatedByAi && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-bright">
            <Sparkles size={11} strokeWidth={2} />
            {t("obra.propostas.aiBadge")}
          </span>
        )}
      </div>

      {isGenerating ? (
        <div className="space-y-2">
          {/* Barra cheia pulsando: a IA não reporta percentual, e inventar um
              número seria mentir sobre o que sabemos. */}
          <Progress
            value={100}
            height={6}
            className="animate-pulse"
            label={t("obra.propostas.generating")}
          />
          <p className="text-center text-xs text-on-surface-variant">
            {t("obra.propostas.generating")}
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          fullWidth
          disabled={!canMutate}
          onClick={() => onGenerate(proposal)}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Sparkles size={14} strokeWidth={1.8} />
            {t("obra.propostas.generate")}
          </span>
        </Button>
      )}

      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
        <button
          type="button"
          onClick={() => onHistory(proposal)}
          className="inline-flex items-center gap-1.5 text-xs text-gold-bright transition-colors hover:text-gold"
        >
          <History size={13} strokeWidth={1.8} />
          {t("obra.propostas.versions.history")}
        </button>
        <Num className="text-[11px] text-on-surface-faint">
          {t("obra.propostas.versions.count", { count: proposal.versionCount })}
        </Num>
      </div>
    </div>
  )
}
