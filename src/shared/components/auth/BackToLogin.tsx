import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/** Rodapé das telas de senha: volta para o login. */
export function BackToLogin() {
  const { t } = useTranslation()

  return (
    <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 self-start text-[14px] font-[650] text-gold-hi hover:underline">
      <ArrowLeft size={15} />
      {t("forgotPassword.backToLogin")}
    </Link>
  )
}
