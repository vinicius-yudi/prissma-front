import { ChevronsLeft } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { DeleteAccountModal } from "@/pages/perfil/components/DeleteAccountModal"
import { PerfilModal } from "@/pages/perfil/components/PerfilModal"
import { Logo } from "@/shared/components/brand/Logo"
import { LogoMark } from "@/shared/components/brand/LogoMark"
import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { SPRING } from "@/shared/constants/motion"
import { useAccess } from "@/shared/hooks/useAccess"

import { NewWorkspaceModal } from "./NewWorkspaceModal"
import { SidebarFooter } from "./SidebarFooter"
import { SidebarNav } from "./SidebarNav"
import { SidebarProjects } from "./SidebarProjects"

const EXPANDED = 264
const COLLAPSED = 72
const STORAGE_KEY = "prissma-sidebar-collapsed"

/** Preferência só deste navegador; sem storage, começa aberta. */
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
  } catch {
    // Storage bloqueado: a preferência só não sobrevive ao recarregar.
  }
}

/**
 * Barra lateral (DS v2, Layout): 264px, recolhível para 72px com mola.
 *
 * Só existe a partir de `lg`; abaixo disso a navegação é a barra inferior.
 * Leva a navegação do workspace, as obras em andamento com o anel de progresso
 * e, no rodapé, a pessoa, a conta ativa e o tema. Os módulos da obra saíram
 * daqui para as abas da própria obra.
 */
export function Sidebar() {
  const { t } = useTranslation()
  const { levelOf } = useAccess()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [newAccountOpen, setNewAccountOpen] = useState(false)

  function handleCollapse(value: boolean) {
    setCollapsed(value)
    writeCollapsed(value)
  }

  return (
    <>
      <motion.aside
        aria-label={t("sidebar.label")}
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={SPRING}
        className="hidden h-dvh flex-none flex-col overflow-hidden border-r border-border bg-surface lg:flex"
      >
        <div className="flex h-16 flex-none items-center justify-between px-4">
          <Link to="/dashboard" aria-label={t("sidebar.nav.home")} className="flex items-center overflow-hidden">
            {collapsed ? <LogoMark size={24} className="ml-1" decorative /> : <Logo size={24} />}
          </Link>
          {!collapsed && (
            <IconButton label={t("sidebar.collapse")} onClick={() => handleCollapse(true)} className="size-8">
              <ChevronsLeft size={16} />
            </IconButton>
          )}
        </div>

        <SidebarNav collapsed={collapsed} />

        {collapsed ? <div className="flex-1" /> : <SidebarProjects canCreate={levelOf("obras") === "w"} />}

        <SidebarFooter
          collapsed={collapsed}
          onExpand={() => handleCollapse(false)}
          onNewAccount={() => setNewAccountOpen(true)}
          onProfile={() => setPerfilOpen(true)}
        />
      </motion.aside>

      <NewWorkspaceModal open={newAccountOpen} onClose={() => setNewAccountOpen(false)} />

      <PerfilModal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        onDeleteAccount={() => {
          setPerfilOpen(false)
          setDeleteAccountOpen(true)
        }}
      />
      <DeleteAccountModal open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
    </>
  )
}
