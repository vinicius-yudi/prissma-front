import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { RoleInProject } from "@/pages/obra-selecionada/types/equipes"

/**
 * Chip de papel — componente único do sistema.
 *
 * O papel é **por obra**: o mesmo usuário é dono de uma e arquiteto convidado
 * em outra. O chip responde "com que papel estou aqui" e aparece na sidebar,
 * nos cards de obra e em Pessoas & papéis.
 *
 * Cores fixas (Style Guide v2 §5): Engenheiro ouro · Arquiteto ouro profundo ·
 * Cliente neutro · Mestre de obras verde. Proprietário acompanha o ouro do
 * engenheiro, como no cartão de contexto do protótipo.
 */

const chip = tv({
  base: "inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-[3px] text-[10.5px] font-bold tracking-[0.04em]",
  variants: {
    role: {
      OWNER: "bg-gold/15 text-gold",
      ENGINEER: "bg-gold/15 text-gold",
      ARCHITECT: "bg-gold-deep/15 text-gold-deep",
      FOREMAN: "bg-ok/15 text-ok",
      USER: "bg-tint text-on-surface-variant",
    },
  },
})

interface RoleChipProps {
  role: RoleInProject
  /** Sobrescreve o rótulo — para chips de contexto como "MINHA OBRA". */
  label?: string
  className?: string
}

export function RoleChip({ role, label, className }: RoleChipProps) {
  const { t } = useTranslation()

  return <span className={chip({ role, className })}>{label ?? t(`roles.${role}`)}</span>
}
