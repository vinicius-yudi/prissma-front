import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronsUpDown,
  HelpCircle,
  LogOut,
  Plus,
  Settings,
  User,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { tv } from "tailwind-variants"

import logoUrl from "@/assets/logo.png"
import { useAuth } from "@/contexts/AuthContext"
import { DeleteAccountModal } from "@/pages/perfil/components/DeleteAccountModal"
import { PerfilModal } from "@/pages/perfil/components/PerfilModal"
import { useObraSelecionada } from "@/pages/obra-selecionada/hooks/useObraSelecionada"
import type { AppModule } from "@/shared/constants/access"
import { UnavailableBadge } from "@/shared/components/ui/unavailable-badge/UnavailableBadge"
import { OBRA_NAV, WORKSPACE_NAV, type NavItem } from "@/shared/constants/nav"
import { useAccess, useObraIdFromPath } from "@/shared/hooks/useAccess"
import { useWorkspaces } from "@/shared/hooks/useWorkspaces"
import type { Workspace } from "@/shared/types/workspace"

import { NewWorkspaceModal } from "./NewWorkspaceModal"

/**
 * Sidebar de dois níveis (Fluxos v2 §1), recolhida em trilho de ícones.
 *
 * **Só existe a partir de `lg`.** Abaixo disso a navegação é a barra de abas
 * com FAB (<BottomTabBar>) mais o trilho de módulos da obra; a gaveta que esta
 * sidebar era no celular saiu junto com o hambúrguer.
 *
 * Fica recolhida e **expande no hover**, voltando a recolher quando o mouse
 * sai. Um espaçador acompanha a largura do painel, então o conteúdo da página é
 * empurrado para o lado em vez de ficar coberto.
 *
 * A lista sai da interseção entre os itens que existem (`constants/nav.ts`) e o
 * que o papel alcança (`constants/access.ts`) — a mesma matriz que alimenta o
 * guard de rota, para nav e permissão não divergirem.
 */

const RAIL = 68
const PANEL = 248

const aside = tv({
  base: "fixed inset-y-0 left-0 z-30 hidden h-dvh flex-col gap-5 overflow-hidden border-r border-outline-variant bg-surface-container-low py-5 transition-[width,padding] duration-200 ease-out lg:flex",
  variants: {
    expanded: {
      true: "px-3.5",
      false: "px-3",
    },
  },
})

const navLink = tv({
  base: "relative flex items-center gap-3 rounded-full py-2.5 text-[13px] font-medium transition-colors",
  variants: {
    active: {
      true: "bg-tint text-on-surface",
      false: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
    },
    expanded: {
      true: "pl-3.5 pr-3",
      false: "justify-center px-0",
    },
  },
})

const railLabel = tv({
  base: "whitespace-nowrap",
})

const accountButton = tv({
  base: "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border transition-colors",
  variants: {
    open: {
      true: "border-outline bg-surface-container-high",
      false: "border-transparent hover:border-outline-variant hover:bg-surface-container-high",
    },
    expanded: {
      true: "p-2 text-left",
      false: "justify-center p-1.5",
    },
  },
})

const contextCard = tv({
  base: "mt-1.5 flex items-center gap-2 rounded-xl border border-outline bg-surface-container-high px-2.5 py-2",
})

const menuItem = tv({
  base: "flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] transition-colors",
  variants: {
    variant: {
      default:
        "cursor-pointer text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
      danger: "cursor-pointer text-danger hover:bg-danger-bg",
      disabled: "cursor-not-allowed text-on-surface-faint",
    },
  },
})

/**
 * Rótulo que só existe quando a sidebar está aberta.
 *
 * Sai do fluxo com `display:none` em vez de só ficar transparente: rótulo
 * invisível mas ocupando largura empurrava o ícone para fora do centro do
 * trilho, e o `gap` do flex ainda contava o item ausente. A animação de
 * largura da própria sidebar já dá o movimento.
 */
function Label({
  expanded,
  children,
  className,
}: {
  expanded: boolean
  children: React.ReactNode
  className?: string
}) {
  if (!expanded) return null
  return <span className={railLabel({ className })}>{children}</span>
}

/**
 * Botão de conta, no topo da sidebar.
 *
 * A logo do produto faz o papel do ícone da conta e é também o único elemento
 * visível quando a sidebar está recolhida — ela já é uma marca fechada, com
 * moldura e fundo próprios, então não recebe wrapper de gradiente.
 */
function AccountButton({
  name,
  subtitle,
  expanded,
  menuOpen,
  onToggle,
}: {
  name: string
  /** Nome do workspace ativo — ou o fallback "Conta pessoal" no rollout. */
  subtitle: string
  expanded: boolean
  menuOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={expanded ? undefined : name}
      aria-expanded={menuOpen}
      className={accountButton({ open: menuOpen, expanded })}
    >
      <img
        src={logoUrl}
        alt="PRISSMA"
        className="size-9 shrink-0 rounded-[10px] object-contain"
      />
      <Label expanded={expanded} className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-on-surface">{name}</span>
        <span className="block truncate text-[10px] text-on-surface-faint">{subtitle}</span>
      </Label>
      {expanded && <ChevronDown size={14} className="shrink-0 text-on-surface-faint" />}
    </button>
  )
}

/**
 * Cartão de contexto da obra, em uma linha.
 *
 * Só o nome, o ponto de status e o switcher. O andamento e o chip de papel
 * saíram: ocupavam três linhas no topo da nav e repetiam informação que a
 * própria Visão geral já mostra com muito mais espaço. Recolhido, sobra o
 * ponto — que já responde "estou dentro de uma obra".
 */
function ObraContextCard({ obraId, expanded }: { obraId: number; expanded: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectQuery } = useObraSelecionada(obraId)

  const project = projectQuery.data

  if (!expanded) {
    return (
      <div className="flex justify-center" title={project?.title ?? ""}>
        <span className="flex size-9 items-center justify-center rounded-xl border border-outline bg-surface-container-high">
          <span className="size-2 rounded-full bg-gold" />
        </span>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/obras")}
        className="flex cursor-pointer items-center gap-1.5 px-1.5 text-[11.5px] font-semibold text-gold-bright hover:underline"
      >
        <ChevronLeft size={13} />
        {t("sidebar.allObras")}
      </button>

      <div className={contextCard()}>
        <span className="size-2 shrink-0 rounded-full bg-gold" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-on-surface">
          {project?.title ?? "—"}
        </span>
        <ChevronsUpDown size={12} className="shrink-0 text-on-surface-faint" />
      </div>
    </div>
  )
}

/**
 * Menu de conta, ancorado no bloco do topo e aberto para baixo.
 *
 * A seção "Contas" lista os workspaces do usuário (próprios + convites
 * aceitos), com a ativa marcada. Clicar em outra conta troca o token
 * (POST /switch) e recarrega a página — nenhum dado da conta anterior
 * sobrevive no cache. "Nova conta" cria um workspace adicional.
 */
function AccountMenu({
  name,
  workspaces,
  activeWorkspaceId,
  isSwitching,
  onSwitch,
  onNewAccount,
  onProfile,
  onLogout,
  onClose,
}: {
  name: string
  workspaces: Workspace[]
  activeWorkspaceId: number | null
  isSwitching: boolean
  onSwitch: (id: number) => void
  onNewAccount: () => void
  onProfile: () => void
  onLogout: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-outline bg-surface-container-high py-1.5 shadow-xl">
      <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-faint">
        {t("sidebar.accountsLabel")}
      </div>

      {workspaces.length === 0 ? (
        // Rollout/carregando: mostra ao menos a identidade atual marcada.
        <div className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-on-surface">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-gold-grad text-[9px] font-bold text-on-primary">
            {name[0]?.toUpperCase() ?? "U"}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
          <Check size={14} className="shrink-0 text-gold-bright" />
        </div>
      ) : (
        workspaces.map((workspace) => {
          const active = workspace.id === activeWorkspaceId
          return (
            <button
              key={workspace.id}
              type="button"
              disabled={active || isSwitching}
              onClick={() => onSwitch(workspace.id)}
              className={menuItem({ variant: "default" })}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-gold-grad text-[9px] font-bold text-on-primary">
                {workspace.name[0]?.toUpperCase() ?? "W"}
              </span>
              <span className="min-w-0 flex-1 truncate text-left font-medium text-on-surface">
                {workspace.name}
              </span>
              {active && <Check size={14} className="shrink-0 text-gold-bright" />}
            </button>
          )
        })
      )}

      <button type="button" className={menuItem({ variant: "default" })} onClick={onNewAccount}>
        <Plus size={15} strokeWidth={1.8} />
        {t("sidebar.accountsNew")}
      </button>

      <div className="my-1.5 h-px bg-outline-variant" />

      <button
        type="button"
        className={menuItem({ variant: "default" })}
        onClick={() => {
          onClose()
          onProfile()
        }}
      >
        <User size={15} strokeWidth={1.8} />
        {t("sidebar.menu.profile")}
      </button>

      <button type="button" disabled className={menuItem({ variant: "disabled" })}>
        <Settings size={15} strokeWidth={1.8} />
        <span className="flex-1 text-left">{t("sidebar.menu.settings")}</span>
        <UnavailableBadge />
      </button>

      <button type="button" disabled className={menuItem({ variant: "disabled" })}>
        <HelpCircle size={15} strokeWidth={1.8} />
        <span className="flex-1 text-left">{t("sidebar.menu.help")}</span>
        <UnavailableBadge />
      </button>

      <div className="my-1.5 h-px bg-outline-variant" />

      <button type="button" className={menuItem({ variant: "danger" })} onClick={onLogout}>
        <LogOut size={15} strokeWidth={1.8} />
        {t("sidebar.menu.logout")}
      </button>
    </div>
  )
}

export function Sidebar() {
  const { logout, user, activeWorkspace } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const obraId = useObraIdFromPath()
  const { levelOf, isReadOnly } = useAccess()
  const { workspaces, switchTo, isSwitching } = useWorkspaces()

  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [newAccountOpen, setNewAccountOpen] = useState(false)
  const footerRef = useRef<HTMLDivElement>(null)

  // Manda o hover — mas o menu de conta aberto segura a expansão, senão o
  // painel desapareceria debaixo do cursor ao sair do trilho.
  const expanded = hovered || menuOpen

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  const inObra = obraId !== null
  const items: NavItem<AppModule>[] = inObra ? OBRA_NAV : WORKSPACE_NAV
  const visible = items.filter((item) => levelOf(item.module) !== "")

  function hrefOf(item: NavItem<AppModule>): string {
    return inObra ? `/obras/${obraId}/${item.path}` : item.path
  }

  const name = user?.name ?? t("sidebar.user")
  const activeWorkspaceName =
    workspaces.find((w) => w.id === activeWorkspace?.workspaceId)?.name ??
    t("sidebar.accountType")

  return (
    <>
      {/* Espaçador que acompanha a largura da sidebar: o conteúdo é empurrado
          para o lado quando ela abre e volta quando recolhe, em vez de ficar
          coberto. Anima com a mesma duração e curva do painel, senão os dois
          se descolam durante a transição. */}
      <div
        className="hidden shrink-0 transition-[width] duration-200 ease-out lg:block"
        style={{ width: expanded ? PANEL : RAIL }}
        aria-hidden
      />

      <aside
        className={aside({ expanded })}
        style={{ width: expanded ? PANEL : RAIL }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          setMenuOpen(false)
        }}
      >
        <div ref={footerRef} className="relative shrink-0">
          <AccountButton
            name={name}
            subtitle={activeWorkspaceName}
            expanded={expanded}
            menuOpen={menuOpen}
            onToggle={() => setMenuOpen((prev) => !prev)}
          />

          {menuOpen && (
            <AccountMenu
              name={name}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspace?.workspaceId ?? null}
              isSwitching={isSwitching}
              onSwitch={switchTo}
              onNewAccount={() => {
                setMenuOpen(false)
                setNewAccountOpen(true)
              }}
              onProfile={() => setPerfilOpen(true)}
              onLogout={logout}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>

        {inObra && (
          <div className="shrink-0">
            <ObraContextCard obraId={obraId} expanded={expanded} />
          </div>
        )}

        {/* O nav é a única região que rola: o bloco de conta e o contexto da
            obra ficam fixos, e a barra de rolagem não invade o trilho. */}
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          <Label
            expanded={expanded}
            className="mb-1.5 block px-3.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-faint"
          >
            {inObra ? t("sidebar.groupObra") : t("sidebar.groupWorkspace")}
          </Label>

          {visible.map((item) => {
            const href = hrefOf(item)
            const active = location.pathname === href
            const Icon = item.icon

            return (
              <NavLink
                key={item.module}
                to={href}
                title={expanded ? undefined : t(item.labelKey)}
                className={navLink({ active, expanded })}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold-grad" />
                )}
                <Icon size={16} strokeWidth={1.7} className="shrink-0" />
                <Label expanded={expanded} className="flex-1">
                  {t(item.labelKey)}
                </Label>
                {/* Somente-leitura sinalizado na própria nav (Acessibilidade §6). */}
                {expanded && isReadOnly(item.module) && (
                  <span className="text-[10px] opacity-50" title={t("header.readOnly")}>
                    👁
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

      </aside>

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
