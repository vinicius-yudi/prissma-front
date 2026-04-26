import logo from "@/assets/svg/logo.svg"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { HardHat, DraftingCompass, User } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { SelectionButton } from "./SelectionButton"

const LOGO_ALT = "Prissma"

interface CadastroTypeProps {
  onTypeSelected: (type: "arquiteto" | "engenheiro" | "cliente") => void
}

export function CadastroType({ onTypeSelected }: CadastroTypeProps) {
  const { t } = useTranslation()

  function handleArchitect() { onTypeSelected("arquiteto") }
  function handleEngineer() { onTypeSelected("engenheiro") }
  function handleClient() { onTypeSelected("cliente") }

  return (
    <section className="relative w-full lg:w-[45%] h-full flex flex-col items-center px-6 sm:px-16 lg:px-24 pt-16 pb-10 lg:py-12 overflow-y-auto bg-surface">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 sm:space-y-12 my-auto">
        <div className="flex justify-center">
          <img src={logo} alt={LOGO_ALT} className="h-25" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-on-surface text-2xl sm:text-3xl font-bold tracking-tight">{t("register.title")}</h2>
          <p className="text-sm text-on-surface-variant">{t("register.subtitle")}</p>
        </div>

        <div className="text-center space-y-2 w-full">
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={HardHat} type="button" onClick={handleArchitect}>
              {t("register.typeArchitect")}
            </SelectionButton>
          </div>
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={DraftingCompass} type="button" onClick={handleEngineer}>
              {t("register.typeEngineer")}
            </SelectionButton>
          </div>
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={User} type="button" onClick={handleClient}>
              {t("register.typeClient")}
            </SelectionButton>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-on-surface-variant">
            {t("register.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-bold text-secondary underline-offset-4 hover:underline ml-1"
            >
              {t("register.login")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
