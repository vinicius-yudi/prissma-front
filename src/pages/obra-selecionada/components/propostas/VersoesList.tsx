import { useTranslation } from "react-i18next"

import type { ProposalStatus, ProposalVersion } from "../../types/proposal"
import { VersaoRow } from "./VersaoRow"

const LOADING = ["a", "b", "c"]

interface VersoesListProps {
  projectId: number
  proposalId: number
  versions: ProposalVersion[]
  isLoading: boolean
  isError: boolean
  canMutate: boolean
  busyVersionId: number | null
  onChangeStatus: (versionId: number, status: ProposalStatus) => void
}

/** As versões, da mais recente à primeira: carregando, erro, vazio ou a lista. */
export function VersoesList({ projectId, proposalId, versions, isLoading, isError, canMutate, busyVersionId, onChangeStatus }: VersoesListProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <ul className="space-y-3 p-0" aria-busy="true">
        {LOADING.map((key) => (
          <li key={key} className="h-20 list-none animate-pulse rounded-md bg-raised" />
        ))}
      </ul>
    )
  }

  if (isError) return <p className="py-8 text-center text-[14px] text-ink-2">{t("obra.propostas.loadError")}</p>
  if (versions.length === 0) return <p className="py-8 text-center text-[14px] text-ink-2">{t("obra.propostas.versions.empty")}</p>

  return (
    <ul className="p-0">
      {[...versions]
        .sort((a, b) => b.version - a.version)
        .map((version) => (
          <VersaoRow
            key={version.id}
            projectId={projectId}
            proposalId={proposalId}
            version={version}
            canMutate={canMutate}
            isBusy={busyVersionId === version.id}
            onChangeStatus={onChangeStatus}
          />
        ))}
    </ul>
  )
}
