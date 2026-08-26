import { HelpCircle, LogOut, Settings, User } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import logoUrl from "@/assets/logo.png"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { UnavailableBadge } from "@/shared/components/ui/unavailable-badge/UnavailableBadge"

import { DeleteAccountModal } from "./components/DeleteAccountModal"
import { PerfilModal } from "./components/PerfilModal"

/**
 * Conta e preferências — a aba "Perfil" da barra do celular.
 *
 * É rota, não folha: a barra de abas navega por URL, e uma tela endereçável
 * pode ser recarregada e compartilhada. Reúne o que no desktop mora no menu de
 * conta da sidebar (perfil, sair, itens adiados) mais tema e idioma, que saem
 * do header no celular por falta de espaço.
 */

const row = tv({
  base: "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors",
  variants: {
    variant: {
      default: "cursor-pointer text-on-surface hover:bg-surface-container-high",
      danger: "cursor-pointer text-danger hover:bg-danger-bg",
      disabled: "cursor-not-allowed text-on-surface-faint",
      static: "text-on-surface",
    },
  },
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-2">
      <h2 className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-faint">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function PerfilPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  const name = user?.name ?? t("sidebar.user")

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <img src={logoUrl} alt="PRISSMA" className="size-10 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">{name}</p>
          <p className="truncate text-[11px] text-on-surface-faint">
            {user?.email ?? t("sidebar.accountType")}
          </p>
        </div>
      </div>

      <Section title={t("profile.page.title")}>
        <button
          type="button"
          className={row({ variant: "default" })}
          onClick={() => setPerfilOpen(true)}
        >
          <User size={16} strokeWidth={1.8} />
          {t("sidebar.menu.profile")}
        </button>

        <button type="button" disabled className={row({ variant: "disabled" })}>
          <Settings size={16} strokeWidth={1.8} />
          <span className="flex-1 text-left">{t("sidebar.menu.settings")}</span>
          <UnavailableBadge />
        </button>

        <button type="button" disabled className={row({ variant: "disabled" })}>
          <HelpCircle size={16} strokeWidth={1.8} />
          <span className="flex-1 text-left">{t("sidebar.menu.help")}</span>
          <UnavailableBadge />
        </button>
      </Section>

      <Section title={t("profile.page.preferences")}>
        <div className={row({ variant: "static" })}>
          <span className="flex-1">{t("profile.page.theme")}</span>
          <ThemeToggle />
        </div>
        <div className={row({ variant: "static" })}>
          <span className="flex-1">{t("profile.page.language")}</span>
          <LanguageSelect />
        </div>
      </Section>

      <Section title={t("profile.page.session")}>
        <button type="button" className={row({ variant: "danger" })} onClick={logout}>
          <LogOut size={16} strokeWidth={1.8} />
          {t("sidebar.menu.logout")}
        </button>
      </Section>

      <PerfilModal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        onDeleteAccount={() => {
          setPerfilOpen(false)
          setDeleteAccountOpen(true)
        }}
      />
      <DeleteAccountModal open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
    </div>
  )
}
