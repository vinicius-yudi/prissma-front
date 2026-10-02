import { Eye } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"
import { WORKSPACE_NAV } from "@/shared/constants/nav"
import { useAccess } from "@/shared/hooks/useAccess"

const item = tv({
  base: "relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-[580] transition-colors",
  variants: {
    active: {
      true: "text-ink",
      false: "text-ink-2 hover:bg-raised hover:text-ink",
    },
    collapsed: {
      true: "justify-center px-0",
    },
  },
})

const icon = tv({
  base: "relative flex-none",
  variants: {
    active: { true: "text-gold-hi" },
  },
})

interface SidebarNavProps {
  collapsed: boolean
}

/**
 * Navegação do workspace. A lista sai da interseção entre o que existe
 * (`constants/nav.ts`) e o que o papel alcança (`constants/access.ts`) — a
 * mesma matriz dos guards de rota. O item ativo é uma pílula `gold-soft` com
 * fio ouro que desliza de um item para o outro.
 */
export function SidebarNav({ collapsed }: SidebarNavProps) {
  const { t } = useTranslation()
  const { levelOf, isReadOnly } = useAccess()
  const visible = WORKSPACE_NAV.filter((entry) => levelOf(entry.module) !== "")

  return (
    <nav className="flex flex-col gap-0.5 px-3 pt-2" aria-label={t("sidebar.navLabel")}>
      {visible.map((entry) => {
        const Icon = entry.icon
        const label = t(entry.labelKey)

        return (
          <NavLink key={entry.module} to={entry.path} title={collapsed ? label : undefined}>
            {({ isActive }) => (
              <span className={item({ active: isActive, collapsed })}>
                {isActive && (
                  <>
                    <motion.span
                      layoutId="sidebar-nav"
                      className="absolute inset-0 rounded-[10px] bg-gold-soft"
                      transition={SPRING}
                    />
                    <motion.span
                      layoutId="sidebar-nav-bar"
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold"
                      transition={SPRING}
                    />
                  </>
                )}
                <Icon size={18} className={icon({ active: isActive })} />
                {!collapsed && <span className="relative flex-1 truncate">{label}</span>}
                {!collapsed && isReadOnly(entry.module) && (
                  <Eye size={14} className="relative text-meta" aria-label={t("header.readOnly")} />
                )}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
