/**
 * Esqueleto da grade.
 *
 * Reproduz a forma do que vai chegar — cartão, barra de ferramentas, coluna de
 * integrante e cinco blocos por linha — em vez de um spinner: o salto de
 * layout na troca é o que faz a tela parecer lenta mesmo quando não é.
 */

const ROWS = [0, 1, 2, 3]
const CELLS = [0, 1, 2, 3, 4]

export function ScheduleLoadingState() {
  return (
    <div className="animate-pulse rounded-lg bg-surface p-5 hairline sm:p-6" aria-busy="true">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-9 w-40 rounded-[12px] bg-raised" />
        <div className="h-6 w-32 rounded-[8px] bg-raised" />
      </div>

      <div className="rounded-md hairline">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
            <div className="flex w-[190px] min-w-[190px] items-center gap-2.5">
              <div className="size-8 rounded-full bg-raised" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded-xs bg-raised" />
                <div className="h-2 w-16 rounded-xs bg-raised" />
              </div>
            </div>
            {CELLS.map((cell) => (
              <div key={cell} className="h-[34px] flex-1 rounded-[8px] bg-raised" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
