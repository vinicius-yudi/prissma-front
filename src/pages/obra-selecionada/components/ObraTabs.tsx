import { useTranslation } from "react-i18next"

import { Tabs } from "@/shared/components/ui/tabs/Tabs"
import type { TabItem } from "@/shared/components/ui/tabs/Tabs"
import { OBRA_NAV } from "@/shared/constants/nav"
import { useAccess } from "@/shared/hooks/useAccess"

/**
 * Seções da obra como abas de rota (DS v2, Tabs), em todas as larguras —
 * fixas sob a barra superior, rolando na horizontal no celular. A lista sai da
 * mesma interseção de sempre (o que existe × o que o papel alcança).
 */
export function ObraTabs({ obraId }: { obraId: number }) {
  const { t } = useTranslation()
  const { levelOf } = useAccess()

  const items: TabItem[] = OBRA_NAV.filter((item) => levelOf(item.module) !== "").map((item) => {
    const Icon = item.icon
    return {
      to: `/obras/${obraId}/${item.path}`,
      label: t(item.labelKey),
      icon: <Icon size={15} />,
    }
  })

  return (
    <div className="sticky top-16 z-(--z-sticky) -mx-4 mb-6 bg-bg/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <Tabs id="obra" label={t("obra.sectionsLabel")} items={items} />
    </div>
  )
}
