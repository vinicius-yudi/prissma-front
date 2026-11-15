import { ExternalLink, MapPin, Navigation } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { useTheme } from "@/contexts/ThemeContext"
import type { Project } from "@/shared/types/project"

import { mapsDirectionsUrl, mapsEmbedUrl, mapsQuery, mapsSearchUrl } from "../../utils/googleMaps"

/**
 * O iframe é bem maior que a janela e fica centrado nela: só o entorno do pino
 * aparece (desce 14px para centrar a cabeça do pino, não a ponta), e o balão
 * de endereço que o Google põe no canto superior esquerdo do embed fica fora
 * do recorte. No escuro o mapa é invertido para não acender no meio da
 * prancha; o hover devolve a cor.
 */
const map = tv({
  base: [
    "pointer-events-none absolute top-[calc(50%+14px)] left-1/2 h-[360px] w-[480px] max-w-none -translate-x-1/2 -translate-y-1/2 border-0",
    "transition-[filter] duration-300",
  ],
  variants: {
    theme: {
      dark: "contrast-[.9] grayscale-[.5] hue-rotate-180 invert group-hover:grayscale-0",
      light: "grayscale-[.6] group-hover:grayscale-0",
    },
  },
})

/**
 * Planta de situação: o mapinha que toda prancha de arquitetura traz no canto
 * mostrando onde fica o terreno. Clicar abre o local no Google Maps; o botão
 * redondo traça a rota de onde o usuário está.
 */
export function ObraSiteMap({ project, className }: { project: Project; className?: string }) {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const query = mapsQuery(project)

  if (!query) return null

  return (
    <div className={className}>
      <div className="relative w-[172px] rounded-md bg-surface p-1 shadow-soft hairline">
        <a
          href={mapsSearchUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("obra.header.openInMaps")}
          title={t("obra.header.openInMaps")}
          className="group block"
        >
          <span className="relative block h-[104px] overflow-hidden rounded-sm bg-raised">
            <iframe
              title={t("obra.header.siteMap")}
              src={mapsEmbedUrl(query, i18n.language)}
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
              className={map({ theme })}
            />
          </span>
          <span className="flex items-center gap-1 px-1.5 pt-1.5 pb-0.5">
            <MapPin size={11} className="flex-none text-gold-hi" />
            <span className="t-meta flex-1 truncate text-ink-2 uppercase group-hover:text-ink">{t("obra.header.siteMap")}</span>
            <ExternalLink size={11} className="flex-none text-meta group-hover:text-gold-hi" />
          </span>
        </a>
        <a
          href={mapsDirectionsUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("obra.header.directions")}
          title={t("obra.header.directions")}
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-surface text-gold-hi shadow-soft hairline transition-[transform,background-color] duration-150 hover:bg-raised active:scale-[0.94]"
        >
          <Navigation size={14} />
        </a>
      </div>
    </div>
  )
}
