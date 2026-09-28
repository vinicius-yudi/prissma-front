import { LayoutGrid, Plus, User } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import { tv } from "tailwind-variants"

import { useRegisteredPrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import type { WorkspaceModule } from "@/shared/constants/access"
import { WORKSPACE_NAV } from "@/shared/constants/nav"
import { useAccess } from "@/shared/hooks/useAccess"

import { MobileMenuSheet } from "./MobileMenuSheet"

/**
 * Barra de abas do celular, com FAB central (Fluxos v2 §9).
 *
 * Substitui a sidebar abaixo de `lg`. Fica **no fluxo**, como último filho da
 * coluna, e não `fixed`: assim a área de rolagem do `<main>` termina acima dela
 * sozinha, sem padding de compensação que erra sempre que a barra muda de
 * altura.
 *
 * Cinco colunas — Início · Obras · FAB · Perfil · Menu. A barra leva aos
 * destinos frequentes; o resto da navegação (os módulos da obra, que são nove,
 * e "Pessoas & papéis") abre na folha "Todas as seções", porque nenhum deles
 * cabe numa aba fixa e empilhá-los aqui daria uma barra que rola.
 *
 * A coluna do FAB existe mesmo sem ação registrada, senão as abas dançariam de
 * posição a cada navegação.
 */

/**
 * Só estes módulos do nível 1 ganham aba. `WORKSPACE_NAV` cresce junto com o
 * produto (Pessoas entrou com o Workspace), mas a grade tem cinco colunas
 * fixas — um sexto filho quebra a linha. O que não está aqui fica na folha.
 */
const TAB_MODULES: ReadonlySet<WorkspaceModule> = new Set(["home", "obras"])

const tab = tv({
  base: "flex min-h-14 flex-col items-center justify-center gap-1 text-[9px] font-semibold transition-colors",
  variants: {
    active: {
      true: "text-gold-bright",
      false: "text-on-surface-faint",
    },
  },
})

function Fab() {
  const action = useRegisteredPrimaryAction()

  if (!action) return <span aria-hidden />

  const Icon = action.icon ?? Plus

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={action.label}
      title={action.label}
      // O conteúdo (46px do disco + rótulo) é mais alto que a barra e está
      // ancorado embaixo, então o disco transborda para cima sozinho — margem
      // negativa não funcionaria aqui, porque numa grade o item é posicionado
      // pela borda inferior.
      className="flex h-full cursor-pointer flex-col items-center justify-end gap-1 pb-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex size-[46px] items-center justify-center rounded-full bg-gold-grad text-on-primary shadow-glow">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <span className="max-w-[72px] truncate text-[9px] font-semibold text-on-surface-variant">
        {action.shortLabel ?? action.label}
      </span>
    </button>
  )
}

export function BottomTabBar() {
  const { t } = useTranslation()
  const { levelOf } = useAccess()
  const [menuOpen, setMenuOpen] = useState(false)

  const visible = WORKSPACE_NAV.filter(
    (item) => TAB_MODULES.has(item.module) && levelOf(item.module) !== "",
  )

  return (
    <>
      <nav
        // `overflow-visible` + `z-30` porque o FAB sobe acima da borda da barra.
        className="z-30 grid shrink-0 grid-cols-5 overflow-visible border-t border-outline-variant bg-surface-container-low pb-safe lg:hidden"
      >
        {visible.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.module}
              to={item.path}
              className={({ isActive }) => tab({ active: isActive })}
            >
              <Icon size={19} strokeWidth={1.8} />
              {t(item.labelKey)}
            </NavLink>
          )
        })}

        <Fab />

        <NavLink to="/perfil" className={({ isActive }) => tab({ active: isActive })}>
          <User size={19} strokeWidth={1.8} />
          {t("sidebar.menu.profile")}
        </NavLink>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          className={tab({ active: menuOpen })}
        >
          <LayoutGrid size={19} strokeWidth={1.8} />
          {t("mobile.menu")}
        </button>
      </nav>

      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
