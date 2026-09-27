import { HelpCircle, LogOut, Settings, User } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { useAuth } from "@/contexts/AuthContext"
import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { UnavailableBadge } from "@/shared/components/ui/unavailable-badge/UnavailableBadge"

import { DeleteAccountModal } from "./components/DeleteAccountModal"
import { PerfilModal } from "./components/PerfilModal"
import { SettingsSection as Section } from "./components/SettingsSection"

/**
 * Conta e preferências — a aba "Perfil" da barra do celular.
 *
 * É rota, não folha: a barra de abas navega por URL, e uma tela endereçável
 * pode ser recarregada e compartilhada. Reúne o que no desktop mora no menu de
 * conta da sidebar (perfil, sair, itens adiados) mais tema e idioma, que saem
 * do header no celular por falta de espaço.
 */

const row = tv({
  base: "flex min-h-12 w-full items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors",
  variants: {
    variant: {
      default: "cursor-pointer text-ink hover:bg-raised",
      danger: "cursor-pointer text-danger hover:bg-danger-soft",
      disabled: "cursor-not-allowed text-ink-3",
      static: "text-ink",
    },
  },
})

export function PerfilPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  const name = user?.name ?? t("sidebar.user")

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="t-title mb-2 text-[clamp(28px,3.4vw,40px)] text-ink">{t("profile.page.title")}</h1>
      <div className="flex items-center gap-4 rounded-lg bg-surface p-5 hairline">
        <Avatar name={name} size={48} />
        <div className="min-w-0">
          <p className="t-section truncate text-ink">{name}</p>
          <p className="truncate text-[13px] text-meta">{user?.email ?? t("sidebar.accountType")}</p>
        </div>
      </div>

      <Section title={t("profile.page.title")}>
        <button
          type="button"
          className={row({ variant: "default" })}
          onClick={() => setPerfilOpen(true)}
        >
          <User size={16} />
          {t("sidebar.menu.profile")}
        </button>

        <button type="button" disabled className={row({ variant: "disabled" })}>
          <Settings size={16} />
          <span className="flex-1 text-left">{t("sidebar.menu.settings")}</span>
          <UnavailableBadge />
        </button>

        <button type="button" disabled className={row({ variant: "disabled" })}>
          <HelpCircle size={16} />
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
          <LogOut size={16} />
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
