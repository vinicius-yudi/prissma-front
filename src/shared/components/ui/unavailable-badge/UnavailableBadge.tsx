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
    <span className="rounded-full bg-warn-bg px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.06em] text-warn">
      {t("sidebar.unavailable")}
    </span>
  )
}
