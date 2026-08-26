import { ChevronRight, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { tv } from "tailwind-variants"

import logoUrl from "@/assets/logo.png"
import { useAuth } from "@/contexts/AuthContext"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { useRegisteredPrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import type { AppModule } from "@/shared/constants/access"
import { OBRA_NAV, WORKSPACE_NAV, type NavItem } from "@/shared/constants/nav"
import { useAccess, useObraIdFromPath } from "@/shared/hooks/useAccess"

/**
 * "Todas as seções" — a folha do botão Menu da barra de abas.
 *
 * A barra comporta três destinos; o resto da navegação mora aqui. Dentro de
 * uma obra a folha abre com os dois níveis empilhados ("Nesta obra" primeiro,
 * depois "Workspace"), que é a mesma leitura da sidebar do desktop — a
 * diferença é que ali os níveis se substituem e aqui convivem, porque no
 * celular sair da obra e voltar custa dois toques a mais.
 *
 * A lista sai da mesma interseção de sempre (o que existe × o que o papel
 * alcança), então nenhum módulo oculto reaparece por este caminho.
 */

const row = tv({
  base: "flex min-h-12 items-center gap-3 rounded-xl px-2 text-sm transition-colors",
  variants: {
    active: {
      true: "bg-tint font-semibold text-on-surface",
      false: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
    },
  },
})

const rowIcon = tv({
  base: "flex size-9 shrink-0 items-center justify-center rounded-[10px] border",
  variants: {
    active: {
      true: "border-gold/40 bg-tint text-gold-bright",
      false: "border-outline-variant bg-surface-container-high text-on-surface-variant",
    },
  },
})

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-faint">
      {children}
    </p>
  )
}

interface MobileMenuSheetProps {
  open: boolean
  onClose: () => void
}

export function MobileMenuSheet({ open, onClose }: MobileMenuSheetProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { levelOf, isReadOnly } = useAccess()
  const obraId = useObraIdFromPath()
  const action = useRegisteredPrimaryAction()

  const visible = (items: NavItem<AppModule>[]) =>
    items.filter((item) => levelOf(item.module) !== "")

  function hrefOf(item: NavItem<AppModule>): string {
    return obraId !== null && !item.path.startsWith("/")
      ? `/obras/${obraId}/${item.path}`
      : item.path
  }

  function renderGroup(label: string, items: NavItem<AppModule>[]) {
    if (items.length === 0) return null

    return (
      <>
        <GroupLabel>{label}</GroupLabel>
        {items.map((item) => {
          const href = hrefOf(item)
          const Icon = item.icon
          const active = pathname === href

          return (
            <NavLink
              key={item.module}
              to={href}
              onClick={onClose}
              className={row({ active })}
            >
              <span className={rowIcon({ active })}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
              {/* Somente-leitura sinalizado aqui também (Acessibilidade §6). */}
              {isReadOnly(item.module) && (
                <span className="text-[11px] opacity-50" title={t("header.readOnly")}>
                  👁
                </span>
              )}
            </NavLink>
          )
        })}
      </>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={t("mobile.menuTitle")} size="lg">
      <div className="px-4 pb-5">
        {/* A ação da tela repetida em largura total: com a folha aberta o FAB
            fica sob o scrim. É um <button> cru, e não o <Button primary>, para
            não disputar o slot de "um primário por tela" com a página que está
            atrás — a folha é chrome, não conteúdo. */}
        {action && (
          <button
            type="button"
            disabled={action.disabled}
            onClick={() => {
              onClose()
              action.onClick()
            }}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-grad text-sm font-semibold text-on-primary shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} strokeWidth={2.2} />
            {action.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose()
            navigate("/perfil")
          }}
          className="mt-3 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left transition-colors hover:bg-surface-container-high"
        >
          <img src={logoUrl} alt="" className="size-9 shrink-0 rounded-[10px] object-contain" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-on-surface">
              {user?.name ?? t("sidebar.user")}
            </span>
            <span className="block text-[11px] text-on-surface-faint">
              {t("sidebar.accountType")}
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-on-surface-faint" />
        </button>

        <nav>
          {obraId !== null && renderGroup(t("sidebar.groupObra"), visible(OBRA_NAV))}
          {renderGroup(t("sidebar.groupWorkspace"), visible(WORKSPACE_NAV))}
        </nav>
      </div>
    </Modal>
  )
}
