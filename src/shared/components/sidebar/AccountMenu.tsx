import { Check, HelpCircle, LogOut, Plus, Settings, User } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { UnavailableBadge } from "@/shared/components/ui/unavailable-badge/UnavailableBadge"
import { SPRING } from "@/shared/constants/motion"
import type { Workspace } from "@/shared/types/workspace"

const menuItem = tv({
  base: "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors",
  variants: {
    variant: {
      default: "cursor-pointer text-ink-2 hover:bg-raised hover:text-ink disabled:cursor-default",
      danger: "cursor-pointer text-danger hover:bg-danger-soft",
      disabled: "cursor-not-allowed text-ink-3",
    },
  },
})

const initialBox = "flex size-5 flex-none items-center justify-center rounded-xs bg-gold-grad text-[9px] font-bold text-on-gold"

export interface AccountMenuProps {
  name: string
  workspaces: Workspace[]
  activeWorkspaceId: number | null
  isSwitching: boolean
  onSwitch: (id: number) => void
  onNewAccount: () => void
  onProfile: () => void
  onLogout: () => void
}

/**
 * Menu de conta, aberto para cima a partir do rodapé da sidebar.
 *
 * "Contas" lista os workspaces do usuário (próprios + convites aceitos), com
 * o ativo marcado. Trocar de conta troca o token e recarrega a página — nenhum
 * dado da conta anterior sobrevive no cache.
 */
export function AccountMenu({
  name,
  workspaces,
  activeWorkspaceId,
  isSwitching,
  onSwitch,
  onNewAccount,
  onProfile,
  onLogout,
}: AccountMenuProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      role="menu"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING}
      className="absolute inset-x-0 bottom-full z-10 mb-2 min-w-[232px] overflow-hidden rounded-lg bg-surface py-1.5 shadow-lift hairline"
    >
      <p className="px-3 pt-1 pb-1 text-[12px] font-semibold text-ink-3">{t("sidebar.accountsLabel")}</p>

      {workspaces.length === 0 && (
        // Rollout/carregando: mostra ao menos a identidade atual marcada.
        <div className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink">
          <span className={initialBox}>{name[0]?.toUpperCase() ?? "U"}</span>
          <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
          <Check size={14} className="flex-none text-gold-hi" />
        </div>
      )}

      {workspaces.map((workspace) => {
        const active = workspace.id === activeWorkspaceId
        return (
          <button
            key={workspace.id}
            type="button"
            role="menuitem"
            disabled={active || isSwitching}
            onClick={() => onSwitch(workspace.id)}
            className={menuItem({ variant: "default" })}
          >
            <span className={initialBox}>{workspace.name[0]?.toUpperCase() ?? "W"}</span>
            <span className="min-w-0 flex-1 truncate text-left font-medium text-ink">{workspace.name}</span>
            {active && <Check size={14} className="flex-none text-gold-hi" />}
          </button>
        )
      })}

      <button type="button" role="menuitem" className={menuItem({ variant: "default" })} onClick={onNewAccount}>
        <Plus size={15} />
        {t("sidebar.accountsNew")}
      </button>

      <div className="my-1.5 h-px bg-border" />

      <button type="button" role="menuitem" className={menuItem({ variant: "default" })} onClick={onProfile}>
        <User size={15} />
        {t("sidebar.menu.profile")}
      </button>

      <button type="button" role="menuitem" disabled className={menuItem({ variant: "disabled" })}>
        <Settings size={15} />
        <span className="flex-1 text-left">{t("sidebar.menu.settings")}</span>
        <UnavailableBadge />
      </button>

      <button type="button" role="menuitem" disabled className={menuItem({ variant: "disabled" })}>
        <HelpCircle size={15} />
        <span className="flex-1 text-left">{t("sidebar.menu.help")}</span>
        <UnavailableBadge />
      </button>

      <div className="my-1.5 h-px bg-border" />

      <button type="button" role="menuitem" className={menuItem({ variant: "danger" })} onClick={onLogout}>
        <LogOut size={15} />
        {t("sidebar.menu.logout")}
      </button>
    </motion.div>
  )
}
