import { DraftingCompass, HardHat, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
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
    <section className="relative flex h-full w-full flex-col justify-center overflow-y-auto rounded-l-[28px] border-l border-[#1e2a3d] bg-[linear-gradient(180deg,#07111f_0%,#020617_100%)] px-8 py-12 sm:px-12 lg:w-[40%] lg:max-w-[560px] lg:px-12 lg:py-16">
      <div className="absolute right-5 top-5 z-10">
        <LanguageSelect />
      </div>

      <div className="mx-auto w-full max-w-[400px]">
        {/* Heading */}
        <div className="bf-enter bf-delay-2 mb-8">
          <h1 className="text-[2rem] font-bold leading-tight text-[#f8fafc]">{t("register.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{t("register.subtitle")}</p>
        </div>

        <div className="bf-enter bf-delay-3 space-y-4">
          <SelectionButton icon={HardHat} onClick={handleArchitect}>
            {t("register.typeArchitect")}
          </SelectionButton>
          <SelectionButton icon={DraftingCompass} onClick={handleEngineer}>
            {t("register.typeEngineer")}
          </SelectionButton>
          <SelectionButton icon={User} onClick={handleClient}>
            {t("register.typeClient")}
          </SelectionButton>
        </div>

        {/* Footer */}
        <p className="bf-enter bf-delay-6 mt-8 text-center text-sm text-[#94a3b8]">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="font-semibold text-[#3b82f6] transition-colors hover:text-[#60a5fa]">
            {t("register.login")}
          </Link>
        </p>
      </div>
    </section>
  )
}
