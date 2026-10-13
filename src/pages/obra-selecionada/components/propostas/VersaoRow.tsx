import { Check, Download, RotateCcw, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { formatDate } from "@/shared/utils/formatters"

import { useProposalImage } from "../../hooks/useProposalImage"
import { ProposalState, type ProposalStatus, type ProposalVersion } from "../../types/proposal"
import { PropostaStatusBadge } from "./PropostaStatusBadge"

const rowAction = tv({
  base: "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-[600] text-ink-2 hairline transition-colors disabled:cursor-default disabled:opacity-40",
  variants: {
    tone: {
      approve: "hover:bg-success-soft hover:text-success",
      reject: "hover:bg-warning-soft hover:text-warning",
      download: "hover:bg-raised hover:text-gold-hi",
    },
  },
  defaultVariants: { tone: "download" },
})

interface VersaoRowProps {
  projectId: number
  proposalId: number
  version: ProposalVersion
  canMutate: boolean
  isBusy: boolean
  onChangeStatus: (versionId: number, status: ProposalStatus) => void
}

/**
 * Uma versão no histórico. Aprovar e pedir ajustes é por versão; baixar vale
 * para quem só enxerga a obra — é um `<a download>` sobre a URL da miniatura,
 * sem segunda ida ao servidor, e só aparece com a URL pronta.
 */
export function VersaoRow({ projectId, proposalId, version, canMutate, isBusy, onChangeStatus }: VersaoRowProps) {
  const { t } = useTranslation()
  const { url } = useProposalImage(projectId, proposalId, version.id, version.hasImage)

  return (
    <li className="flex gap-3.5 border-b border-border py-3.5 last:border-b-0">
      <div className="size-16 flex-none overflow-hidden rounded-sm">
        {url ? (
          <img src={url} alt={t("obra.propostas.versions.thumbAlt", { version: version.version })} className="size-full object-cover" />
        ) : (
          <div className="blueprint size-full bg-raised" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-num text-[14px] font-[650] text-ink">v{version.version}</span>
          <PropostaStatusBadge status={version.status} />
          {version.generatedByAi && (
            <span className="inline-flex items-center gap-1 text-[12px] font-[620] text-gold-hi">
              <Sparkles size={12} />
              {t("obra.propostas.aiBadge")}
            </span>
          )}
        </div>
        {version.description && <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-2">{version.description}</p>}
        <p className="text-[12px] text-meta">
          {version.authorName} · <span className="t-num">{formatDate(version.submittedAt)}</span>
        </p>

        {(canMutate || url) && (
          <div className="mt-1 flex flex-wrap gap-2">
            {canMutate && (
              <>
                <button
                  type="button"
                  disabled={isBusy || version.status === ProposalState.APPROVED}
                  onClick={() => onChangeStatus(version.id, ProposalState.APPROVED)}
                  className={rowAction({ tone: "approve" })}
                >
                  <Check size={13} />
                  {t("obra.propostas.versions.approve")}
                </button>
                <button
                  type="button"
                  disabled={isBusy || version.status === ProposalState.REJECTED}
                  onClick={() => onChangeStatus(version.id, ProposalState.REJECTED)}
                  className={rowAction({ tone: "reject" })}
                >
                  <RotateCcw size={13} />
                  {t("obra.propostas.versions.requestChanges")}
                </button>
              </>
            )}
            {url && (
              // O nome vem do servidor (`previa-ia-v3.png`); o fallback cobre a versão gravada sem ele.
              <a href={url} download={version.fileName ?? `v${version.version}`} className={rowAction({ tone: "download" })}>
                <Download size={13} />
                {t("obra.propostas.versions.download")}
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
