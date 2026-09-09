/**
 * Torre de vidro em obra, holográfica — SVG e CSS puros, sem canvas nem
 * dependência: pele de vidro translúcida sobre a grade de caixilhos (com
 * painéis acesos pulsando), face lateral em fuga, varredura BIM subindo a
 * fachada, linha de cota, esqueleto metálico no topo e uma grua içando carga.
 *
 * Veio do protótipo azul da branch `refactor-tela-login`. Aqui o traço é o
 * ouro da marca: nenhum valor de cor no arquivo, só tokens — o desenho troca
 * de tema junto com o resto da interface.
 */

const FRONT_L = 205
const FRONT_R = 340
const ROOF = 175 // topo da parte já revestida
const GROUND = 600
const FRAME_TOP = 125 // topo do esqueleto metálico em obra
const DEPTH_DX = 58 // fuga horizontal da face lateral
const DEPTH_DY = 46 // fuga vertical da face lateral
const FLOORS = 9
const BAYS = 4

const floorH = (GROUND - ROOF) / FLOORS
const bayW = (FRONT_R - FRONT_L) / BAYS
const floorYs = Array.from({ length: FLOORS + 1 }, (_, i) => ROOF + i * floorH)
const columnXs = Array.from({ length: BAYS + 1 }, (_, j) => FRONT_L + j * bayW)
const mullionXs = columnXs.slice(0, BAYS).map((x) => x + bayW / 2)

// Prumadas do caixilho: uma coluna estrutural mais um montante no meio do vão.
const windowColEdges = [...columnXs.slice(0, BAYS).flatMap((x) => [x, x + bayW / 2]), columnXs[BAYS]]
const NUM_COLS = windowColEdges.length - 1

// Painéis acesos espalhados (~33%), determinísticos: sem Math.random, o desenho
// é o mesmo a cada render e não pisca na hidratação.
const litCells = Array.from({ length: FLOORS }).flatMap((_, i) =>
  Array.from({ length: NUM_COLS }).flatMap((_, k) => ((i * 7 + k * 11) % 9 < 3 ? [[i, k] as const] : [])),
)

const sideLitFloors = [1, 3, 6]

const ORBIT_CENTER = { x: 300, y: 390 }
const ORBIT_RX = 258
const ORBIT_RY = 168
const orbitDots = [0, 58, 116, 174, 232, 300].map((deg) => {
  const rad = (deg * Math.PI) / 180
  return {
    x: ORBIT_CENTER.x + ORBIT_RX * Math.cos(rad),
    y: ORBIT_CENTER.y + ORBIT_RY * Math.sin(rad),
  }
})

const WIN_PAD_X = 2.5
const WIN_PAD_Y = 5

export function HolographicBuildingOverlay() {
  return (
    <svg viewBox="0 0 600 680" preserveAspectRatio="xMidYMid meet" className="size-full" aria-hidden="true">
      <defs>
        <filter id="pk-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="pk-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--pk-bl)" stopOpacity="0.2" />
          <stop offset="60%" stopColor="var(--pk-b1)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--pk-bg)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pk-glass" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="var(--pk-bl)" stopOpacity="0.16" />
          <stop offset="45%" stopColor="var(--pk-b1)" stopOpacity="0.07" />
          <stop offset="100%" stopColor="var(--pk-b2)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="pk-scan-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pk-bl)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--pk-bl)" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <ellipse cx={ORBIT_CENTER.x} cy={ORBIT_CENTER.y} rx="260" ry="230" fill="url(#pk-aura)" className="glow-line" />

      {/* Partículas em órbita */}
      <g
        className="orbit-slow"
        style={{ transformBox: "view-box", transformOrigin: `${ORBIT_CENTER.x}px ${ORBIT_CENTER.y}px` }}
      >
        <ellipse
          cx={ORBIT_CENTER.x}
          cy={ORBIT_CENTER.y}
          rx={ORBIT_RX}
          ry={ORBIT_RY}
          fill="none"
          strokeWidth="0.6"
          strokeOpacity="0.2"
          strokeDasharray="2 9"
          className="stroke-gold"
        />
        {orbitDots.map((dot, i) => (
          <circle
            key={`orbit-${dot.x.toFixed(0)}-${dot.y.toFixed(0)}`}
            cx={dot.x}
            cy={dot.y}
            r="2.6"
            className="fill-gold-bright pulse-dot"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </g>

      {/* Terreno */}
      <g filter="url(#pk-soft-glow)" className="stroke-gold">
        <line x1="110" y1={GROUND} x2="520" y2={GROUND} strokeWidth="1.4" strokeOpacity="0.7" pathLength={1} className="draw-line" style={{ animationDelay: "0.1s" }} />
        <line x1={FRONT_R} y1={GROUND} x2={FRONT_R + DEPTH_DX} y2={GROUND - DEPTH_DY} strokeWidth="1.2" strokeOpacity="0.4" pathLength={1} className="draw-line" style={{ animationDelay: "0.2s" }} />
        <line x1={FRONT_R + DEPTH_DX} y1={GROUND - DEPTH_DY} x2="520" y2={GROUND - DEPTH_DY} strokeWidth="1" strokeOpacity="0.3" pathLength={1} className="draw-line" style={{ animationDelay: "0.3s" }} />
      </g>

      {/* Linha de cota (anotação BIM) */}
      <g strokeOpacity="0.3" strokeWidth="0.8" fill="none" className="stroke-gold">
        <line x1="178" y1={FRAME_TOP} x2="178" y2={GROUND} pathLength={1} className="draw-line" style={{ animationDelay: "2.1s" }} />
        <line x1="172" y1={FRAME_TOP} x2="184" y2={FRAME_TOP} pathLength={1} className="draw-line" style={{ animationDelay: "2.2s" }} />
        <line x1="172" y1={GROUND} x2="184" y2={GROUND} pathLength={1} className="draw-line" style={{ animationDelay: "2.2s" }} />
      </g>

      {/* Grua, atrás da torre e mais apagada */}
      <g fill="none" strokeOpacity="0.55" filter="url(#pk-soft-glow)" className="stroke-gold">
        <line x1="438" y1={GROUND} x2="438" y2="108" strokeWidth="1.6" pathLength={1} className="draw-line" style={{ animationDelay: "0.9s" }} />
        <line x1="450" y1={GROUND} x2="450" y2="108" strokeWidth="1" strokeOpacity="0.4" pathLength={1} className="draw-line" style={{ animationDelay: "0.95s" }} />
        {[180, 280, 380, 480].map((y, i) => (
          <line key={`mast-${y}`} x1="438" y1={y} x2="450" y2={y + 50} strokeWidth="0.7" strokeOpacity="0.4" pathLength={1} className="draw-line" style={{ animationDelay: `${1 + i * 0.05}s` }} />
        ))}
        <polyline points="438,108 444,84 450,108" strokeWidth="1.2" pathLength={1} className="draw-line" style={{ animationDelay: "1.1s" }} />
        <rect x="432" y="110" width="14" height="14" strokeWidth="1" pathLength={1} className="draw-line" style={{ animationDelay: "1.2s" }} />
        <line x1="232" y1="110" x2="512" y2="110" strokeWidth="1.4" pathLength={1} className="draw-line" style={{ animationDelay: "1.2s" }} />
        <line x1="232" y1="116" x2="444" y2="116" strokeWidth="0.7" strokeOpacity="0.4" pathLength={1} className="draw-line" style={{ animationDelay: "1.3s" }} />
        <line x1="444" y1="84" x2="250" y2="110" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: "1.25s" }} />
        <line x1="444" y1="84" x2="504" y2="110" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: "1.25s" }} />
        <rect x="500" y="110" width="18" height="12" strokeWidth="1" pathLength={1} className="draw-line" style={{ animationDelay: "1.35s" }} />

        {/* Cabo do gancho e feixe de vergalhão içado */}
        <line x1="298" y1="110" x2="298" y2="226" strokeWidth="0.9" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: "1.5s" }} />
        <line x1="282" y1="232" x2="314" y2="232" strokeWidth="1.6" strokeOpacity="0.7" pathLength={1} className="draw-line" style={{ animationDelay: "1.7s" }} />
        <line x1="286" y1="226" x2="298" y2="226" strokeWidth="0.7" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: "1.65s" }} />
        <line x1="310" y1="226" x2="298" y2="226" strokeWidth="0.7" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: "1.65s" }} />
        <circle cx="298" cy="110" r="2.4" stroke="none" className="fill-gold-bright pulse-dot" style={{ animationDelay: "1.8s" }} />
      </g>

      {/* ---- A torre ---- */}
      <g className="float-slow">
        <rect x={FRONT_L} y={ROOF} width={FRONT_R - FRONT_L} height={GROUND - ROOF} fill="url(#pk-glass)" />
        <polygon
          points={`${FRONT_R},${ROOF} ${FRONT_R + DEPTH_DX},${ROOF - DEPTH_DY} ${FRONT_R + DEPTH_DX},${GROUND - DEPTH_DY} ${FRONT_R},${GROUND}`}
          fillOpacity="0.55"
          className="fill-surface-container-low"
        />

        <g fill="none" filter="url(#pk-soft-glow)" className="stroke-gold-bright">
          {/* Painéis acesos da face lateral */}
          {sideLitFloors.map((i) => (
            <polygon
              key={`side-lit-${i}`}
              points={`${FRONT_R + 3},${floorYs[i] + 4} ${FRONT_R + DEPTH_DX - 3},${floorYs[i] - DEPTH_DY + 4} ${FRONT_R + DEPTH_DX - 3},${floorYs[i + 1] - DEPTH_DY - 4} ${FRONT_R + 3},${floorYs[i + 1] - 4}`}
              stroke="none"
              className="fill-gold pulse-pane"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}

          {/* Painéis acesos da fachada */}
          {litCells.map(([i, k]) => (
            <rect
              key={`win-${i}-${k}`}
              x={windowColEdges[k] + WIN_PAD_X}
              y={floorYs[i] + WIN_PAD_Y}
              width={windowColEdges[k + 1] - windowColEdges[k] - WIN_PAD_X * 2}
              height={floorH - WIN_PAD_Y * 2}
              rx="1"
              fillOpacity={0.32 + ((i + k) % 3) * 0.18}
              stroke="none"
              className="fill-gold-bright pulse-pane"
              style={{ animationDelay: `${((i + k) % 5) * 0.6}s` }}
            />
          ))}

          {/* Lajes: frente e face em fuga */}
          {floorYs.map((y, i) => (
            <g key={`floor-${i}`} className="stroke-gold">
              <line x1={FRONT_L} y1={y} x2={FRONT_R} y2={y} strokeWidth={i === 0 ? 1.6 : 1} strokeOpacity="0.85" pathLength={1} className="draw-line" style={{ animationDelay: `${0.5 + i * 0.08}s` }} />
              <line x1={FRONT_R} y1={y} x2={FRONT_R + DEPTH_DX} y2={y - DEPTH_DY} strokeWidth="0.9" strokeOpacity="0.5" pathLength={1} className="draw-line" style={{ animationDelay: `${0.6 + i * 0.08}s` }} />
            </g>
          ))}

          {/* Montantes */}
          {mullionXs.map((x, i) => (
            <line key={`mull-${x.toFixed(0)}`} x1={x} y1={ROOF} x2={x} y2={GROUND} strokeWidth="0.7" strokeOpacity="0.35" pathLength={1} className="stroke-gold draw-line" style={{ animationDelay: `${0.9 + i * 0.06}s` }} />
          ))}

          {/* Colunas estruturais da fachada */}
          {columnXs.map((x, i) => {
            const edge = i === 0 || i === BAYS
            return (
              <line key={`col-${x.toFixed(0)}`} x1={x} y1={ROOF} x2={x} y2={GROUND} strokeWidth={edge ? 1.8 : 1} strokeOpacity={edge ? 1 : 0.6} pathLength={1} className="draw-line" style={{ animationDelay: `${0.3 + i * 0.07}s` }} />
            )
          })}

          <line x1={FRONT_R + DEPTH_DX} y1={ROOF - DEPTH_DY} x2={FRONT_R + DEPTH_DX} y2={GROUND - DEPTH_DY} strokeWidth="1.6" pathLength={1} className="draw-line" style={{ animationDelay: "0.5s" }} />

          {/* Varredura BIM subindo a fachada */}
          <g className="scan-sweep">
            <rect x={FRONT_L} y={GROUND - 26} width={FRONT_R - FRONT_L} height="26" fill="url(#pk-scan-grad)" stroke="none" />
            <line x1={FRONT_L} y1={GROUND} x2={FRONT_R} y2={GROUND} strokeWidth="1.6" strokeOpacity="0.9" />
          </g>

          {/* ---- Esqueleto metálico no topo (em obra) ---- */}
          {columnXs.map((x, i) => (
            <g key={`frame-${x.toFixed(0)}`}>
              <line x1={x} y1={ROOF} x2={x} y2={FRAME_TOP} strokeWidth="1.3" strokeOpacity="0.9" pathLength={1} className="draw-line" style={{ animationDelay: `${1.4 + i * 0.07}s` }} />
              <line x1={x} y1={FRAME_TOP} x2={x} y2={FRAME_TOP - 11} strokeWidth="1" strokeOpacity="0.7" pathLength={1} className="draw-line" style={{ animationDelay: `${1.8 + i * 0.05}s` }} />
            </g>
          ))}
          <line x1={FRONT_L} y1={FRAME_TOP} x2={FRONT_R} y2={FRAME_TOP} strokeWidth="1.2" strokeOpacity="0.85" pathLength={1} className="draw-line" style={{ animationDelay: "1.6s" }} />
          <line x1={FRONT_L} y1={(ROOF + FRAME_TOP) / 2} x2={FRONT_R} y2={(ROOF + FRAME_TOP) / 2} strokeWidth="1" strokeOpacity="0.6" pathLength={1} className="stroke-gold draw-line" style={{ animationDelay: "1.55s" }} />
          <line x1={FRONT_L} y1={ROOF} x2={columnXs[1]} y2={FRAME_TOP} strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="stroke-gold draw-line" style={{ animationDelay: "1.7s" }} />
          <line x1={columnXs[BAYS - 1]} y1={FRAME_TOP} x2={FRONT_R} y2={ROOF} strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="stroke-gold draw-line" style={{ animationDelay: "1.75s" }} />
          <line x1={FRONT_R} y1={FRAME_TOP} x2={FRONT_R + DEPTH_DX} y2={FRAME_TOP - DEPTH_DY} strokeWidth="0.9" strokeOpacity="0.45" pathLength={1} className="stroke-gold draw-line" style={{ animationDelay: "1.65s" }} />
          <line x1={FRONT_R + DEPTH_DX} y1={ROOF - DEPTH_DY} x2={FRONT_R + DEPTH_DX} y2={FRAME_TOP - DEPTH_DY} strokeWidth="1.1" strokeOpacity="0.7" pathLength={1} className="draw-line" style={{ animationDelay: "1.7s" }} />

          {/* Nós pulsando no nível ativo da obra */}
          {columnXs.map((x, i) => (
            <circle key={`node-${x.toFixed(0)}`} cx={x} cy={ROOF} r="3" stroke="none" className="fill-gold-bright pulse-dot" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
          <circle cx={FRONT_R + DEPTH_DX} cy={ROOF - DEPTH_DY} r="2.6" stroke="none" className="fill-gold-bright pulse-dot" style={{ animationDelay: "0.6s" }} />
        </g>
      </g>
    </svg>
  )
}
