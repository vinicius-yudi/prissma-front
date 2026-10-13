import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { DocKind } from "../../utils/documentKind"

const band = tv({
  variants: { kind: { pdf: "fill-danger", doc: "fill-ink-2", img: "fill-gold" } },
})

/**
 * Folha com a orelha dobrada e a faixa do tipo (redesign): reconhece-se o
 * arquivo pelo formato antes de ler o nome.
 */
export function FileSheet({ kind }: { kind: DocKind }) {
  const { t } = useTranslation()

  return (
    <svg viewBox="0 0 40 48" className="h-12 w-10 flex-none" aria-hidden="true">
      <path d="M4 2h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" className="fill-surface stroke-border-strong" />
      <path d="M26 2v8a2 2 0 0 0 2 2h8" fill="none" className="stroke-border-strong" />
      <rect x="2" y="28" width="26" height="11" rx="2" className={band({ kind })} />
      <text x="15" y="36.3" textAnchor="middle" fontSize="7.4" fontWeight="700" className="fill-on-inverse [font-variation-settings:'wdth'_110]">
        {t(`obra.documentos.kindShort.${kind}`)}
      </text>
      <path d="M8 16h14M8 20h18M8 24h10" strokeWidth="1.4" strokeLinecap="round" className="stroke-border-strong" />
    </svg>
  )
}
