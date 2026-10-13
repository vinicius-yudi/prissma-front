import type { FachadaGeometry } from "./fachadaGeometry"

interface FachadaLinesProps {
  geo: FachadaGeometry
  floors: number
}

/** Traços da fachada — os mesmos no previsto (tracejado) e no executado (ouro). */
export function FachadaLines({ geo, floors }: FachadaLinesProps) {
  const slabs = Array.from({ length: Math.max(0, floors - 1) }, (_, i) => geo.ground - (i + 1) * geo.floorHeight)

  return (
    <>
      <rect x={geo.x0} y={geo.top} width={geo.width} height={geo.bodyHeight} />
      {slabs.map((y) => (
        <line key={y} x1={geo.x0} x2={geo.x0 + geo.width} y1={y} y2={y} />
      ))}
      <path d={geo.roofPath} />
      {geo.windows.map((w) => (
        <g key={`${w.x}-${w.y}`}>
          <rect x={w.x} y={w.y} width={w.w} height={w.h} />
          <line x1={w.x + w.w / 2} x2={w.x + w.w / 2} y1={w.y} y2={w.y + w.h} opacity={0.6} />
        </g>
      ))}
      <rect x={geo.door.x} y={geo.door.y} width={geo.door.w} height={geo.door.h} />
    </>
  )
}
