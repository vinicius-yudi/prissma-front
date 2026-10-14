import { ExternalLink, MapPin, Navigation } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatProjectAddress } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"

import { mapsDirectionsUrl, mapsQuery, mapsSearchUrl } from "../../utils/googleMaps"

/**
 * Endereço da obra ligado ao Google Maps: o texto abre o local e o chip
 * "Como chegar" traça a rota de onde o usuário está — no celular abre o app.
 * Do `sm` para cima a rota mora na <ObraSiteMap>; o chip some para não repetir.
 */
export function ObraAddress({ project }: { project: Project }) {
  const { t } = useTranslation()
  const query = mapsQuery(project)

  if (!query) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <a
        href={mapsSearchUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        title={t("obra.header.openInMaps")}
        className="group inline-flex min-w-0 items-center gap-1.5 text-[13.5px] text-ink-2 hover:text-ink"
      >
        <MapPin size={14} className="flex-none text-meta group-hover:text-gold-hi" />
        <span className="group-hover:underline">{formatProjectAddress(project)}</span>
        <ExternalLink size={12} className="flex-none text-meta opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
      <a
        href={mapsDirectionsUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-7 flex-none sm:hidden items-center gap-1.5 rounded-pill px-2.5 text-[12px] font-[620] text-gold-hi hairline transition-[transform,background-color] duration-150 hover:bg-raised active:scale-[0.97]"
      >
        <Navigation size={12} />
        {t("obra.header.directions")}
      </a>
    </div>
  )
}
