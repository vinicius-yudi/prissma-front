import { useTranslation } from "react-i18next"

import { Tabs } from "@/shared/components/ui/tabs/Tabs"
import type { TabItem } from "@/shared/components/ui/tabs/Tabs"
import type { ObraModule } from "@/shared/constants/access"
import { OBRA_NAV } from "@/shared/constants/nav"
import { useAccess } from "@/shared/hooks/useAccess"

import type { ObraHeaderData } from "../hooks/useObraHeader"

interface ObraTabsProps {
  obraId: number
  /** Números e alertas das abas; sem eles, só os rótulos. */
  data?: ObraHeaderData
}

function countsFrom(data: ObraHeaderData | undefined): Partial<Record<ObraModule, number>> {
  // Antes do acompanhamento chegar, sem número — "0 etapas" seria mentira.
  if (!data || data.progress.progress === null) return {}
  return {
    etapas: data.progress.stages.length,
    tarefas: data.progress.openTasks,
    equipes: data.members.length,
  }
}

function alertsFrom(data: ObraHeaderData | undefined): Partial<Record<ObraModule, boolean>> {
  return {
    etapas: (data?.progress.lateCount ?? 0) > 0,
    orcamento: !!data?.budget?.exceeded,
  }
}

/**
 * Seções da obra como abas de rota (DS v2, Tabs), em todas as larguras —
 * fixas sob a barra superior, rolando na horizontal no celular. Cada aba traz
 * a contagem e um ponto `danger` quando há atraso ou estouro: o usuário vê
 * onde está o problema sem abrir. A lista sai da mesma interseção de sempre
 * (o que existe × o que o papel alcança).
 */
export function ObraTabs({ obraId, data }: ObraTabsProps) {
  const { t } = useTranslation()
  const { levelOf } = useAccess()
  const counts = countsFrom(data)
  const alerts = alertsFrom(data)

  const items: TabItem[] = OBRA_NAV.filter((item) => levelOf(item.module) !== "").map((item) => {
    const Icon = item.icon
    return {
      to: `/obras/${obraId}/${item.path}`,
      label: t(item.labelKey),
      icon: <Icon size={15} />,
      count: counts[item.module],
      alert: alerts[item.module],
    }
  })

  return (
    <div className="sticky top-16 z-(--z-sticky) -mx-4 mb-6 bg-bg/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <Tabs id="obra" label={t("obra.sectionsLabel")} items={items} />
    </div>
  )
}
