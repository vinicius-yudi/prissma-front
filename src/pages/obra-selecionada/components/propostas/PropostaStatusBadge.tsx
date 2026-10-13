import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { ProposalStatus } from "../../types/proposal"

/**
 * Selo de aprovação da versão (Telas §19): Aprovada em `success`, Em análise
 * em ouro, Ajustes pedidos em `warning`, Rascunho neutro. `StatusBadge` cobre
 * obra/etapa/tarefa, que é outro vocabulário. Sempre ponto **e** texto.
 */

const badge = tv({
  base: "inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-[11.5px] font-[620]",
  variants: {
    status: {
      APPROVED: "bg-success-soft text-success",
      PENDING_REVIEW: "bg-gold-soft text-gold-hi",
      REJECTED: "bg-warning-soft text-warning",
      DRAFT: "bg-raised text-ink-2 hairline",
    },
  },
})

const dot = tv({
  base: "size-1.5 rounded-full",
  variants: {
    status: { APPROVED: "bg-success", PENDING_REVIEW: "bg-gold", REJECTED: "bg-warning", DRAFT: "bg-ink-3" },
  },
})

export function PropostaStatusBadge({ status }: { status: ProposalStatus }) {
  const { t } = useTranslation()

  return (
    <span className={badge({ status })}>
      <span className={dot({ status })} aria-hidden="true" />
      {t(`obra.propostas.status.${status}`)}
    </span>
  )
}
