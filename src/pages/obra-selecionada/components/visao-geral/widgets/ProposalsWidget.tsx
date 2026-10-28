import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { formatDate } from "@/shared/utils/formatters"

import { propostasQueryKey } from "../../../hooks/usePropostas"
import { listProposals } from "../../../services/propostas.service"
import { SectionCard } from "../SectionCard"
import { WidgetSkeleton } from "./WidgetSkeleton"

const MAX = 4

/**
 * Propostas cuja versão mais recente espera decisão do cliente. Lê a mesma
 * chave da aba Propostas, então aprovar lá atualiza aqui.
 */
export function ProposalsWidget({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: propostasQueryKey(projectId),
    queryFn: () => listProposals(projectId),
  })

  const pending = (query.data?.content ?? []).filter((p) => p.latestVersion?.status === "PENDING_REVIEW")

  return (
    <SectionCard
      title={t("obra.visaoGeral.widgets.proposals.title")}
      meta={query.isSuccess ? pending.length : undefined}
      action={{ to: `/obras/${projectId}/propostas`, label: t("obra.visaoGeral.widgets.proposals.action") }}
    >
      {query.isLoading ? (
        <WidgetSkeleton rows={2} />
      ) : query.isError ? (
        <p className="text-[14px] text-danger">{t("obra.visaoGeral.widgets.loadError")}</p>
      ) : pending.length === 0 ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.widgets.proposals.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {pending.slice(0, MAX).map((proposal) => (
            <li key={proposal.id} className="min-w-0">
              <p className="truncate text-[14px] font-[580] text-ink">{proposal.title}</p>
              <p className="t-num text-[12px] text-meta">
                {t("obra.visaoGeral.widgets.proposals.version", {
                  version: proposal.latestVersion?.version ?? 1,
                  author: proposal.latestVersion?.authorName ?? proposal.createdByName,
                })}
                {proposal.latestVersion && ` · ${formatDate(proposal.latestVersion.submittedAt)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
