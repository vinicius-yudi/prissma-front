import { Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

import logoUrl from "@/assets/logo.png"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { useAccess, useCurrentModule } from "@/shared/hooks/useAccess"

import { HeaderSearch } from "./HeaderSearch"

/**
 * O aviso de somente-leitura sai da mesma matriz que gera a sidebar, então
 * nenhuma tela precisa declarar que está em modo leitura — e não há como uma
 * esquecer (Fluxos v2 §3).
 *
 * No celular fica só o olho: a frase inteira é `shrink-0` e espremia o campo de
 * busca até sumir. O sentido continua acessível pelo `title`/`aria-label`.
 */
function ReadOnlyNotice() {
  const { t } = useTranslation()
  return (
    <div
      title={t("header.readOnly")}
      aria-label={t("header.readOnly")}
      className="flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-warn-bg px-2.5 text-[11.5px] font-semibold text-warn sm:px-3"
    >
      <Eye size={13} strokeWidth={1.8} />
      <span className="hidden sm:inline">{t("header.readOnly")}</span>
    </div>
  )
}

export function Header() {
  const module = useCurrentModule()
  const { isReadOnly } = useAccess()

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 lg:h-16 lg:gap-4 lg:px-6">
      {/* A marca só aparece no celular: no desktop ela já está no topo da
          sidebar, e repeti-la roubaria a largura da busca. */}
      <img
        src={logoUrl}
        alt="PRISSMA"
        className="size-8 shrink-0 rounded-[8px] object-contain lg:hidden"
      />

      <HeaderSearch />

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {module && isReadOnly(module) && <ReadOnlyNotice />}
        {/* Tema e idioma migram para a tela de Perfil no celular — três
            controles fixos à direita não cabem ao lado da busca. */}
        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSelect />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
