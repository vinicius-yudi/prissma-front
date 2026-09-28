import { DraftingCompass, HardHat, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Brand } from "@/shared/components/brand/Brand"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"

import { SelectionButton } from "./SelectionButton"

interface CadastroTypeProps {
  onTypeSelected: (type: "arquiteto" | "engenheiro" | "cliente") => void
}

export function CadastroType({ onTypeSelected }: CadastroTypeProps) {
  const { t } = useTranslation()

  function handleArchitect() {
    onTypeSelected("arquiteto")
  }

  function handleEngineer() {
    onTypeSelected("engenheiro")
  }

  function handleClient() {
    onTypeSelected("cliente")
  }

  return (
    <section className="relative flex h-full w-full flex-col items-center overflow-y-auto bg-surface px-6 pb-10 pt-16 sm:px-16 lg:w-[45%] lg:px-24 lg:py-12">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>

      <div className="my-auto w-full max-w-md space-y-8 sm:space-y-12">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="enter-up space-y-2 text-center" style={{ animationDelay: "0.16s" }}>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">{t("register.title")}</h2>
          <p className="text-sm text-on-surface-variant">{t("register.subtitle")}</p>
        </div>

        <div className="enter-up space-y-4" style={{ animationDelay: "0.24s" }}>
          <SelectionButton icon={HardHat} type="button" onClick={handleArchitect}>
            {t("register.typeArchitect")}
          </SelectionButton>
          <SelectionButton icon={DraftingCompass} type="button" onClick={handleEngineer}>
            {t("register.typeEngineer")}
          </SelectionButton>
          <SelectionButton icon={User} type="button" onClick={handleClient}>
            {t("register.typeClient")}
          </SelectionButton>
        </div>

        <p className="enter-up text-center text-sm text-on-surface-variant" style={{ animationDelay: "0.48s" }}>
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="ml-1 font-bold text-gold-bright underline-offset-4 hover:underline">
            {t("register.login")}
          </Link>
        </p>
      </div>
    </section>
  )
}
