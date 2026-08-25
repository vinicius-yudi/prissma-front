import { Eye, Menu } from "lucide-react"
import { useTranslation } from "react-i18next"

import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { useAccess, useCurrentModule } from "@/shared/hooks/useAccess"

interface HeaderProps {
  onMenuClick: () => void
}

/**
 * O aviso de somente-leitura sai da mesma matriz que gera a sidebar, então
 * nenhuma tela precisa declarar que está em modo leitura — e não há como uma
 * esquecer (Fluxos v2 §3).
 */
function ReadOnlyNotice() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded-full bg-warn-bg px-3 py-1.5 text-[11.5px] font-semibold text-warn">
      <Eye size={13} strokeWidth={1.8} />
      {t("header.readOnly")}
    </div>
  )
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation()
  const module = useCurrentModule()
  const { isReadOnly } = useAccess()

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="cursor-pointer rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high lg:hidden"
        aria-label={t("header.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {module && isReadOnly(module) && <ReadOnlyNotice />}

      <div className="ml-auto flex items-center gap-3">
        <LanguageSelect />
        <ThemeToggle />
      </div>
    </header>
  )
}
