import { Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

/**
 * Aviso de somente-leitura: sai da mesma matriz que gera a navegação, então
 * nenhuma tela precisa declarar que está em modo leitura. No celular fica só o
 * olho; o sentido continua no nome acessível.
 */
export function ReadOnlyNotice() {
  const { t } = useTranslation()

  return (
    <div
      title={t("header.readOnly")}
      aria-label={t("header.readOnly")}
      className="flex h-9 flex-none items-center gap-2 rounded-pill bg-warning-soft px-2.5 text-[12px] font-semibold text-warning sm:px-3"
    >
      <Eye size={14} />
      <span className="hidden sm:inline">{t("header.readOnly")}</span>
    </div>
  )
}
