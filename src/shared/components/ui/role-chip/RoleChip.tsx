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
 * DS v2: papel não é estado, então todos são neutros — só o responsável pela
 * obra (`OWNER`) fica em ouro. A cor fica reservada para estado.
 */

const chip = tv({
  base: "inline-flex h-[26px] items-center whitespace-nowrap rounded-pill px-2.5 text-[12px] font-semibold",
  variants: {
    role: {
      OWNER: "bg-gold-soft text-gold-hi",
      ENGINEER: "bg-raised text-ink-2 hairline",
      ARCHITECT: "bg-raised text-ink-2 hairline",
      FOREMAN: "bg-raised text-ink-2 hairline",
      USER: "bg-raised text-ink-2 hairline",
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
