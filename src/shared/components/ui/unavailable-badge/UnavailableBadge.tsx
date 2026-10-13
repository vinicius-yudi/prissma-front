import { useTranslation } from "react-i18next"

/**
 * Marca um item de menu que o design especifica mas que ainda não abre nada.
 *
 * Item cinza sem explicação lê como bug; com o selo, lê como roadmap. Vive no
 * kit porque a sidebar e a tela de Perfil listam os mesmos itens adiados.
 */
export function UnavailableBadge() {
  const { t } = useTranslation()
  return (
    <span className="rounded-pill bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
      {t("sidebar.unavailable")}
    </span>
  )
}
