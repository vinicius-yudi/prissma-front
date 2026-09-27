import { Avatar } from "./Avatar"

interface AvatarStackProps {
  /** Pessoas já com chave estável (id) — nunca índice. */
  people: { id: string | number; name: string }[]
  /** Acima disso vira "+N". */
  max?: number
  size?: number
  className?: string
}

/** Pilha de avatares com sobreposição de 8px e anel da superfície. */
export function AvatarStack({ people, max = 4, size = 28, className }: AvatarStackProps) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length

  return (
    <div className={className}>
      <div className="flex items-center -space-x-2">
        {shown.map((person) => (
          <Avatar key={person.id} name={person.name} size={size} ring />
        ))}
        {extra > 0 && (
          <span
            className="t-num inline-flex items-center justify-center rounded-full bg-raised text-ink-2 ring-2 ring-surface"
            style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
          >
            +{extra}
          </span>
        )}
      </div>
    </div>
  )
}
