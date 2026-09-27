import { ChevronsLeft, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { useAuth } from "@/contexts/AuthContext"
import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { useWorkspaces } from "@/shared/hooks/useWorkspaces"

import { AccountMenu } from "./AccountMenu"

const footer = tv({
  base: "border-t border-border p-3",
  variants: {
    collapsed: {
      true: "flex flex-col items-center gap-2",
    },
  },
})

const accountButton = tv({
  base: "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[10px] p-1 text-left transition-colors hover:bg-raised",
  variants: {
    open: { true: "bg-raised" },
    collapsed: { false: "flex-1" },
  },
})

interface SidebarFooterProps {
  collapsed: boolean
  onExpand: () => void
  onNewAccount: () => void
  onProfile: () => void
}

/**
 * Rodapé da sidebar: pessoa e conta ativa (abre o menu de contas), tema e —
 * recolhida — o botão de expandir.
 */
export function SidebarFooter({ collapsed, onExpand, onNewAccount, onProfile }: SidebarFooterProps) {
  const { t } = useTranslation()
  const { logout, user, activeWorkspace } = useAuth()
  const { workspaces, switchTo, isSwitching } = useWorkspaces()
  const [menuOpen, setMenuOpen] = useState(false)

  const name = user?.name ?? t("sidebar.user")
  const workspaceName =
    workspaces.find((w) => w.id === activeWorkspace?.workspaceId)?.name ?? t("sidebar.accountType")

  function close() {
    setMenuOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") close()
  }

  return (
    <div className={footer({ collapsed })}>
      {collapsed && (
        <IconButton label={t("sidebar.expand")} onClick={onExpand}>
          <ChevronsLeft size={16} className="rotate-180" />
        </IconButton>
      )}

      <div className="relative flex items-center gap-1" onKeyDown={handleKeyDown}>
        {menuOpen && (
          // Camada invisível: clicar fora fecha o menu sem ouvinte global.
          <div className="fixed inset-0 z-0" aria-hidden="true" onClick={close} />
        )}

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title={collapsed ? name : undefined}
          onClick={() => setMenuOpen((open) => !open)}
          className={accountButton({ open: menuOpen, collapsed })}
        >
          <Avatar name={name} size={34} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-[620] text-ink">{name}</span>
              <span className="block truncate text-[12px] text-meta">{workspaceName}</span>
            </span>
          )}
          {!collapsed && <ChevronsUpDown size={14} className="flex-none text-ink-3" />}
        </button>

        {!collapsed && <ThemeToggle />}

        {menuOpen && (
          <AccountMenu
            name={name}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspace?.workspaceId ?? null}
            isSwitching={isSwitching}
            onSwitch={switchTo}
            onNewAccount={() => {
              close()
              onNewAccount()
            }}
            onProfile={() => {
              close()
              onProfile()
            }}
            onLogout={logout}
          />
        )}
      </div>

      {collapsed && <ThemeToggle />}
    </div>
  )
}
