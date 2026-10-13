import { motion } from "motion/react"
import { useId } from "react"

import { fachadaGeometry, VIEW_H, VIEW_W } from "./fachadaGeometry"
import { FachadaLines } from "./FachadaLines"
import type { FachadaRoof } from "./fachadaGeometry"

interface FachadaProps {
  /** 0–100: recorta a camada construída de baixo para cima. */
  progress: number
  floors?: number
  roof?: FachadaRoof
  /** Varia as janelas — use o id da obra, para o desenho não mudar entre telas. */
  seed?: number
  /** Cota vertical à esquerda. Some nas miniaturas. */
  showDims?: boolean
  className?: string
}

/**
 * Fachada — a obra desenhada em prancha, assinatura principal do PRISSMA.
 *
 * O executado aparece em traço ouro contínuo e preenchido; o que falta,
 * tracejado em `ink-3` (tracejado = previsto). A camada construída sobe com
 * mola lenta ao montar. No hover de um `group` pai, o tracejado "anda".
 * Não use como decoração: ela sempre representa o progresso de uma obra real.
 */
export function Fachada({
  progress,
  floors = 2,
  roof = "gable",
  seed = 1,
  showDims = true,
  className,
}: FachadaProps) {
  const uid = useId().replace(/:/g, "")
  const geo = fachadaGeometry({ floors, roof, seed, showDims })
  const pct = Math.max(0, Math.min(100, progress)) / 100
  const builtHeight = (geo.ground - geo.totalTop + 2) * pct

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      aria-hidden="true"
      fill="none"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={`built-${uid}`}>
          <motion.rect
            x="0"
            width={VIEW_W}
            initial={{ y: geo.ground + 2, height: 0 }}
            animate={{ y: geo.ground + 2 - builtHeight, height: builtHeight }}
            transition={{ type: "spring", stiffness: 50, damping: 18, delay: 0.1 }}
          />
        </clipPath>
        <pattern id={`soil-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-3)" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      {/* solo: a única hachura a 45° do sistema */}
      <rect x="10" y={geo.ground} width="220" height="10" fill={`url(#soil-${uid})`} />
      <line x1="6" x2="234" y1={geo.ground} y2={geo.ground} stroke="var(--ink-2)" strokeWidth="1.4" />

      {/* previsto */}
      <g
        stroke="var(--ink-3)"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.85"
        className="group-hover:march"
        data-planned
      >
        <FachadaLines geo={geo} floors={floors} />
      </g>

      {/* executado */}
      <g clipPath={`url(#built-${uid})`} data-built>
        <rect x={geo.x0} y={geo.top} width={geo.width} height={geo.bodyHeight} fill="var(--gold)" opacity="0.16" />
        {geo.roofHeight > 8 && <path d={`${geo.roofPath} Z`} fill="var(--gold)" opacity="0.16" />}
        <g stroke="var(--gold)" strokeWidth="1.5">
          <FachadaLines geo={geo} floors={floors} />
        </g>
      </g>

      {/* cota de altura */}
      {showDims && (
        <g stroke="var(--ink-3)" strokeWidth="0.8" data-dims>
          <line x1={geo.x0 - 22} x2={geo.x0 - 22} y1={geo.ground} y2={geo.totalTop} />
          <line x1={geo.x0 - 26} x2={geo.x0 - 18} y1={geo.ground + 4} y2={geo.ground - 4} />
          <line x1={geo.x0 - 26} x2={geo.x0 - 18} y1={geo.totalTop + 4} y2={geo.totalTop - 4} />
          <line x1={geo.x0 - 28} x2={geo.x0 - 4} y1={geo.totalTop} y2={geo.totalTop} strokeDasharray="1 2" />
        </g>
      )}
    </svg>
  )
}
