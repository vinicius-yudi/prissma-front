import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { ProposalStatus } from "../types/proposal"

/**
 * Badge de aprovação da proposta (Telas §19).
 *
 * Quatro estados, cada um com o token que a spec designou: Aprovada em `ok`,
 * Em análise no realce sobre tint, Ajustes pedidos em `warn`, Rascunho neutro.
 * Não existe Badge genérico no design system — `StatusBadge` cobre o enum de
 * obras e etapas, que é outro.
 *
 * Sempre ponto **e** texto: status nunca se comunica só por cor.
 */

const badge = tv({
  base: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold",
  variants: {
    status: {
      APPROVED: "bg-ok-bg text-ok",
      PENDING_REVIEW: "bg-tint text-gold-bright",
      REJECTED: "bg-warn-bg text-warn",
      DRAFT: "bg-tint text-on-surface-faint",
    },
  },
})

const dot = tv({
  base: "size-1.5 rounded-full",
  variants: {
    status: {
      APPROVED: "bg-ok",
      PENDING_REVIEW: "bg-gold-bright",
      REJECTED: "bg-warn",
      DRAFT: "bg-on-surface-faint",
    },
  },
})

interface PropostaStatusBadgeProps {
  status: ProposalStatus
}

export function PropostaStatusBadge({ status }: PropostaStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span className={badge({ status })}>
      <span className={dot({ status })} aria-hidden />
      {t(`obra.propostas.status.${status}`)}
    </span>
  )
}
