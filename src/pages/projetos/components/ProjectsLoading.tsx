const PLACEHOLDERS = ["a", "b", "c", "d", "e", "f"]

/** Esqueleto da grade de obras enquanto a lista carrega. */
export function ProjectsLoading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {PLACEHOLDERS.map((key) => (
        <div key={key} className="h-[340px] animate-pulse rounded-[18px] bg-surface hairline" />
      ))}
    </div>
  )
}
