import { Building2, Home, User, UserCog } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"
import type { WorkspaceModule } from "@/shared/constants/access"
import { useAccess } from "@/shared/hooks/useAccess"

interface Tab {
  to: string
  icon: LucideIcon
  labelKey: string
  /** Módulo da matriz de acesso; Perfil não é módulo — todo usuário alcança. */
  module?: WorkspaceModule
}

const TABS: Tab[] = [
  { to: "/dashboard", icon: Home, labelKey: "sidebar.nav.home", module: "home" },
  { to: "/obras", icon: Building2, labelKey: "sidebar.nav.obras", module: "obras" },
  { to: "/pessoas", icon: UserCog, labelKey: "mobile.nav.pessoas", module: "pessoas" },
  { to: "/perfil", icon: User, labelKey: "sidebar.menu.profile" },
]

const grid = tv({
  base: "grid",
  variants: {
    cols: {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
    },
  },
})

const icon = tv({
  variants: {
    active: {
      true: "text-gold-hi",
      false: "text-meta",
    },
  },
})

const label = tv({
  base: "relative",
  variants: {
    active: {
      true: "text-ink",
      false: "text-meta",
    },
  },
})

/**
 * Navegação inferior do celular (DS v2, Layout): quatro destinos, indicador
 * ouro que desliza no topo do item ativo. Fica no fluxo, como último filho da
 * coluna, para a área que rola terminar acima dela sozinha. Os módulos da obra
 * ficam nas abas da própria obra.
 */
export function MobileNav() {
  const { t } = useTranslation()
  const { levelOf } = useAccess()
  const visible = TABS.filter((tab) => !tab.module || levelOf(tab.module) !== "")
  const cols = Math.max(2, visible.length) as 2 | 3 | 4

  return (
    <nav
      aria-label={t("sidebar.navLabel")}
      className="z-(--z-nav) flex-none border-t border-border bg-surface/90 pb-safe backdrop-blur-xl lg:hidden"
    >
      <div className={grid({ cols })}>
        {visible.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav"
                      className="absolute top-0 h-[3px] w-10 rounded-b-full bg-gold"
                      transition={SPRING}
                    />
                  )}
                  <Icon size={20} className={icon({ active: isActive })} />
                  <span className={label({ active: isActive })}>{t(tab.labelKey)}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
