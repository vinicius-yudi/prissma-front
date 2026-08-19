export function BudgetLoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="h-24 bg-surface-container-low rounded-xl" />
        <div className="h-24 bg-surface-container-low rounded-xl" />
        <div className="h-24 bg-surface-container-low rounded-xl" />
        <div className="h-24 bg-surface-container-low rounded-xl" />
      </div>
      <div className="h-3 bg-surface-container-low rounded-full" />
      <div className="h-24 bg-surface-container-low rounded-xl" />
      <div className="h-24 bg-surface-container-low rounded-xl" />
    </div>
  )
}
