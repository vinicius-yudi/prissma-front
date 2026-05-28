// Holographic glass tower *under construction*, pure SVG/CSS: a translucent glass
// skin over a curtain-wall grid (some panes lit + pulsing), a shaded receding side
// face, a BIM scan sweep climbing the facade, an engineering dimension line, a steel
// skeleton on top and a tower crane lifting a load. No canvas, no deps.

const FRONT_L = 205
const FRONT_R = 340
const ROOF = 175 // top of the clad/finished portion
const GROUND = 600
const FRAME_TOP = 125 // top of the under-construction steel frame
const DEPTH_DX = 58 // side-face horizontal offset (perspective)
const DEPTH_DY = 46 // side-face vertical offset (perspective)
const FLOORS = 9
const BAYS = 4

const floorH = (GROUND - ROOF) / FLOORS
const bayW = (FRONT_R - FRONT_L) / BAYS
const floorYs = Array.from({ length: FLOORS + 1 }, (_, i) => ROOF + i * floorH)
const columnXs = Array.from({ length: BAYS + 1 }, (_, j) => FRONT_L + j * bayW)
const mullionXs = columnXs.slice(0, BAYS).map((x) => x + bayW / 2)

// Curtain-wall column edges: a structural column + a mid-bay mullion per bay.
const windowColEdges = [
  ...columnXs.slice(0, BAYS).flatMap((x) => [x, x + bayW / 2]),
  columnXs[BAYS],
]
const NUM_COLS = windowColEdges.length - 1

// Deterministic scattered lit panes (~33%).
const litCells = Array.from({ length: FLOORS }).flatMap((_, i) =>
  Array.from({ length: NUM_COLS }).flatMap((_, k) =>
    (i * 7 + k * 11) % 9 < 3 ? [[i, k] as const] : [],
  ),
)

const sideLitFloors = [1, 3, 6]

const ORBIT_CENTER = { x: 300, y: 390 }
const ORBIT_RX = 258
const ORBIT_RY = 168
const orbitAngles = [0, 58, 116, 174, 232, 300]
const orbitDots = orbitAngles.map((deg) => {
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
    <svg viewBox="0 0 600 680" preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-hidden="true">
      <defs>
        <filter id="bf-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bf-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00a3ff" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bf-glass" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="bf-scan-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00a3ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#00a3ff" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Aura */}
      <ellipse cx={ORBIT_CENTER.x} cy={ORBIT_CENTER.y} rx="260" ry="230" fill="url(#bf-aura)" className="bf-glow-line" />

      {/* Orbiting connected particles */}
      <g className="bf-orbit" style={{ transformBox: "view-box", transformOrigin: `${ORBIT_CENTER.x}px ${ORBIT_CENTER.y}px` }}>
        <ellipse cx={ORBIT_CENTER.x} cy={ORBIT_CENTER.y} rx={ORBIT_RX} ry={ORBIT_RY} fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.2" strokeDasharray="2 9" />
        {orbitDots.map((dot, i) => (
          <circle key={`orbit-${dot.x.toFixed(0)}-${dot.y.toFixed(0)}`} cx={dot.x} cy={dot.y} r="2.6" fill="#60a5fa" className="bf-dot" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </g>

      {/* Ground line */}
      <g stroke="#3b82f6" filter="url(#bf-soft-glow)">
        <line x1="110" y1={GROUND} x2="520" y2={GROUND} strokeWidth="1.4" strokeOpacity="0.7" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.1s" }} />
        <line x1={FRONT_R} y1={GROUND} x2={FRONT_R + DEPTH_DX} y2={GROUND - DEPTH_DY} strokeWidth="1.2" strokeOpacity="0.4" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.2s" }} />
        <line x1={FRONT_R + DEPTH_DX} y1={GROUND - DEPTH_DY} x2="520" y2={GROUND - DEPTH_DY} strokeWidth="1" strokeOpacity="0.3" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.3s" }} />
      </g>

      {/* Engineering dimension line (BIM annotation) */}
      <g stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="0.8" fill="none">
        <line x1="178" y1={FRAME_TOP} x2="178" y2={GROUND} pathLength={1} className="bf-draw-line" style={{ animationDelay: "2.1s" }} />
        <line x1="172" y1={FRAME_TOP} x2="184" y2={FRAME_TOP} pathLength={1} className="bf-draw-line" style={{ animationDelay: "2.2s" }} />
        <line x1="172" y1={GROUND} x2="184" y2={GROUND} pathLength={1} className="bf-draw-line" style={{ animationDelay: "2.2s" }} />
      </g>

      {/* Tower crane (dimmer, sits behind the tower) */}
      <g fill="none" stroke="#3b82f6" strokeOpacity="0.55" filter="url(#bf-soft-glow)">
        <line x1="438" y1={GROUND} x2="438" y2="108" strokeWidth="1.6" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.9s" }} />
        <line x1="450" y1={GROUND} x2="450" y2="108" strokeWidth="1" strokeOpacity="0.4" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.95s" }} />
        {[180, 280, 380, 480].map((y, i) => (
          <line key={`mast-${y}`} x1="438" y1={y} x2="450" y2={y + 50} strokeWidth="0.7" strokeOpacity="0.4" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${1 + i * 0.05}s` }} />
        ))}
        <polyline points="438,108 444,84 450,108" strokeWidth="1.2" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.1s" }} />
        <rect x="432" y="110" width="14" height="14" strokeWidth="1" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.2s" }} />
        <line x1="232" y1="110" x2="512" y2="110" strokeWidth="1.4" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.2s" }} />
        <line x1="232" y1="116" x2="444" y2="116" strokeWidth="0.7" strokeOpacity="0.4" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.3s" }} />
        <line x1="444" y1="84" x2="250" y2="110" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.25s" }} />
        <line x1="444" y1="84" x2="504" y2="110" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.25s" }} />
        <rect x="500" y="110" width="18" height="12" strokeWidth="1" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.35s" }} />
        {/* Hook cable + lifted rebar bundle */}
        <line x1="298" y1="110" x2="298" y2="226" strokeWidth="0.9" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.5s" }} />
        <line x1="282" y1="232" x2="314" y2="232" strokeWidth="1.6" strokeOpacity="0.7" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.7s" }} />
        <line x1="286" y1="226" x2="298" y2="226" strokeWidth="0.7" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.65s" }} />
        <line x1="310" y1="226" x2="298" y2="226" strokeWidth="0.7" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.65s" }} />
        <circle cx="298" cy="110" r="2.4" fill="#60a5fa" stroke="none" className="bf-dot" style={{ animationDelay: "1.8s" }} />
      </g>

      {/* ---- The tower ---- */}
      <g className="bf-float">
        {/* Glass skins (translucent volume) */}
        <rect x={FRONT_L} y={ROOF} width={FRONT_R - FRONT_L} height={GROUND - ROOF} fill="url(#bf-glass)" />
        <polygon
          points={`${FRONT_R},${ROOF} ${FRONT_R + DEPTH_DX},${ROOF - DEPTH_DY} ${FRONT_R + DEPTH_DX},${GROUND - DEPTH_DY} ${FRONT_R},${GROUND}`}
          fill="#0a1830"
          fillOpacity="0.55"
        />

        <g fill="none" stroke="#00a3ff" filter="url(#bf-soft-glow)">
          {/* Side-face lit panels (depth) */}
          {sideLitFloors.map((i) => (
            <polygon
              key={`side-lit-${i}`}
              points={`${FRONT_R + 3},${floorYs[i] + 4} ${FRONT_R + DEPTH_DX - 3},${floorYs[i] - DEPTH_DY + 4} ${FRONT_R + DEPTH_DX - 3},${floorYs[i + 1] - DEPTH_DY - 4} ${FRONT_R + 3},${floorYs[i + 1] - 4}`}
              fill="#3b82f6"
              stroke="none"
              className="bf-win"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}

          {/* Lit front panes */}
          {litCells.map(([i, k]) => {
            const op = 0.32 + ((i + k) % 3) * 0.18
            return (
              <rect
                key={`win-${i}-${k}`}
                x={windowColEdges[k] + WIN_PAD_X}
                y={floorYs[i] + WIN_PAD_Y}
                width={windowColEdges[k + 1] - windowColEdges[k] - WIN_PAD_X * 2}
                height={floorH - WIN_PAD_Y * 2}
                rx="1"
                fill="#7dd3fc"
                fillOpacity={op}
                stroke="none"
                className="bf-win"
                style={{ animationDelay: `${((i + k) % 5) * 0.6}s` }}
              />
            )
          })}

          {/* Floor slabs (front + receding side) */}
          {floorYs.map((y, i) => (
            <g key={`floor-${i}`}>
              <line x1={FRONT_L} y1={y} x2={FRONT_R} y2={y} stroke="#3b82f6" strokeWidth={i === 0 ? 1.6 : 1} strokeOpacity="0.85" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${0.5 + i * 0.08}s` }} />
              <line x1={FRONT_R} y1={y} x2={FRONT_R + DEPTH_DX} y2={y - DEPTH_DY} stroke="#3b82f6" strokeWidth="0.9" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${0.6 + i * 0.08}s` }} />
            </g>
          ))}

          {/* Mullions (mid-bay window dividers) */}
          {mullionXs.map((x, i) => (
            <line key={`mull-${x.toFixed(0)}`} x1={x} y1={ROOF} x2={x} y2={GROUND} stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.35" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${0.9 + i * 0.06}s` }} />
          ))}

          {/* Front-face structural columns */}
          {columnXs.map((x, i) => {
            const edge = i === 0 || i === BAYS
            return (
              <line key={`col-${x.toFixed(0)}`} x1={x} y1={ROOF} x2={x} y2={GROUND} stroke="#00a3ff" strokeWidth={edge ? 1.8 : 1} strokeOpacity={edge ? 1 : 0.6} pathLength={1} className="bf-draw-line" style={{ animationDelay: `${0.3 + i * 0.07}s` }} />
            )
          })}

          {/* Side back-right edge */}
          <line x1={FRONT_R + DEPTH_DX} y1={ROOF - DEPTH_DY} x2={FRONT_R + DEPTH_DX} y2={GROUND - DEPTH_DY} stroke="#00a3ff" strokeWidth="1.6" pathLength={1} className="bf-draw-line" style={{ animationDelay: "0.5s" }} />

          {/* BIM scan sweep over the facade */}
          <g className="bf-scan">
            <rect x={FRONT_L} y={GROUND - 26} width={FRONT_R - FRONT_L} height="26" fill="url(#bf-scan-grad)" stroke="none" />
            <line x1={FRONT_L} y1={GROUND} x2={FRONT_R} y2={GROUND} stroke="#7dd3fc" strokeWidth="1.6" strokeOpacity="0.9" />
          </g>

          {/* ---- Steel skeleton on top (under construction) ---- */}
          {columnXs.map((x, i) => (
            <g key={`frame-${x.toFixed(0)}`}>
              <line x1={x} y1={ROOF} x2={x} y2={FRAME_TOP} stroke="#60a5fa" strokeWidth="1.3" strokeOpacity="0.9" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${1.4 + i * 0.07}s` }} />
              <line x1={x} y1={FRAME_TOP} x2={x} y2={FRAME_TOP - 11} stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.7" pathLength={1} className="bf-draw-line" style={{ animationDelay: `${1.8 + i * 0.05}s` }} />
            </g>
          ))}
          <line x1={FRONT_L} y1={FRAME_TOP} x2={FRONT_R} y2={FRAME_TOP} stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.85" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.6s" }} />
          <line x1={FRONT_L} y1={(ROOF + FRAME_TOP) / 2} x2={FRONT_R} y2={(ROOF + FRAME_TOP) / 2} stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.6" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.55s" }} />
          <line x1={FRONT_L} y1={ROOF} x2={columnXs[1]} y2={FRAME_TOP} stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.7s" }} />
          <line x1={columnXs[BAYS - 1]} y1={FRAME_TOP} x2={FRONT_R} y2={ROOF} stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.5" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.75s" }} />
          <line x1={FRONT_R} y1={FRAME_TOP} x2={FRONT_R + DEPTH_DX} y2={FRAME_TOP - DEPTH_DY} stroke="#3b82f6" strokeWidth="0.9" strokeOpacity="0.45" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.65s" }} />
          <line x1={FRONT_R + DEPTH_DX} y1={ROOF - DEPTH_DY} x2={FRONT_R + DEPTH_DX} y2={FRAME_TOP - DEPTH_DY} stroke="#60a5fa" strokeWidth="1.1" strokeOpacity="0.7" pathLength={1} className="bf-draw-line" style={{ animationDelay: "1.7s" }} />

          {/* Pulsing nodes at the active construction level */}
          {columnXs.map((x, i) => (
            <circle key={`node-${x.toFixed(0)}`} cx={x} cy={ROOF} r="3" fill="#60a5fa" stroke="none" className="bf-dot" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
          <circle cx={FRONT_R + DEPTH_DX} cy={ROOF - DEPTH_DY} r="2.6" fill="#00a3ff" stroke="none" className="bf-dot" style={{ animationDelay: "0.6s" }} />
        </g>
      </g>
    </svg>
  )
}
