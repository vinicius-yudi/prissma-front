/**
 * Esqueleto da grade.
 *
 * Reproduz a forma do que vai chegar — cabeçalho, coluna de integrante e cinco
 * blocos por linha — em vez de um spinner centralizado: o salto de layout na
 * troca é o que faz a tela parecer lenta mesmo quando não é.
 */

const ROWS = [0, 1, 2, 3]
const CELLS = [0, 1, 2, 3, 4]

export function ScheduleLoadingState() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-9 w-40 rounded-full bg-surface-container-high" />
        <div className="h-6 w-32 rounded-lg bg-surface-container-high" />
      </div>

      <div className="rounded-xl border border-outline-variant">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 border-b border-outline-variant p-3 last:border-b-0">
            <div className="flex w-[170px] min-w-[170px] items-center gap-2.5">
              <div className="size-8 rounded-full bg-surface-container-high" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-surface-container-high" />
                <div className="h-2 w-16 rounded bg-surface-container-high" />
              </div>
            </div>
            {CELLS.map((cell) => (
              <div key={cell} className="h-[34px] flex-1 rounded-lg bg-surface-container-high" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
