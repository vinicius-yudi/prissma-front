import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { LogoMark } from "@/shared/components/brand/LogoMark"
import { Button } from "@/shared/components/ui/button/Button"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { useAccess, useCurrentModule } from "@/shared/hooks/useAccess"

import { ReadOnlyNotice } from "./ReadOnlyNotice"
import { SearchTrigger } from "./SearchTrigger"

/**
 * Barra superior (DS v2, Layout): 64px, fixa no topo da área que rola, fundo
 * `bg` translúcido com blur. Busca ⌘K, "Nova obra" e, no celular, a marca e o
 * tema (que no desktop moram na sidebar).
 *
 * "Nova obra" some na própria lista de obras: ali a página já tem a ação
 * primária, e duas primárias na mesma vista competem.
 */
export function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const module = useCurrentModule()
  const { levelOf, isReadOnly } = useAccess()

  const canCreate = levelOf("obras") === "w" && pathname !== "/obras"

  return (
    <header className="sticky top-0 z-(--z-topbar) flex h-16 flex-none items-center gap-3 border-b border-border bg-bg/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:px-6 lg:px-8">
      <Link to="/dashboard" aria-label={t("sidebar.nav.home")} className="flex-none lg:hidden">
        <LogoMark size={22} decorative />
      </Link>

      <SearchTrigger />

      <div className="ml-auto flex flex-none items-center gap-1.5">
        {module && isReadOnly(module) && <ReadOnlyNotice />}
        {canCreate && (
          <Button
            size="sm"
            fullWidth={false}
            onClick={() => navigate("/obras?nova=1")}
            className="hidden h-10 sm:inline-flex"
          >
            <Plus size={16} />
            {t("sidebar.newObra")}
          </Button>
        )}
        <div className="hidden sm:block">
          <LanguageSelect />
        </div>
        <div className="lg:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
