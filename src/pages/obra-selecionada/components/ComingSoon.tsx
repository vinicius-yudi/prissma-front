import { ChartNoAxesColumn } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

/**
 * Módulo que o design especifica mas ficou para depois (Indicadores). Melhor
 * uma tela honesta, dizendo o que virá, que um item de menu que não abre.
 */
export function ComingSoon({ module }: { module: string }) {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<ChartNoAxesColumn size={26} />}
      title={t(`sidebar.nav.${module}`)}
      body={t(`obra.comingSoonBody.${module}`)}
      action={<span className="rounded-pill bg-gold-soft px-3 py-1 text-[12.5px] font-[620] text-gold-hi">{t("obra.comingSoon")}</span>}
    />
  )
}
