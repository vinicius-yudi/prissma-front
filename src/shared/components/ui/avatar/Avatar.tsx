import type { CSSProperties } from "react"
import { tv } from "tailwind-variants"

import { avatarHue, initials } from "./avatarHue"

const avatar = tv({
  base: "inline-flex flex-none items-center justify-center rounded-full font-[680] [font-variation-settings:'wdth'_110]",
  variants: {
    empty: {
      true: "border border-dashed border-border-strong text-meta",
      false: "avatar-hue",
    },
    ring: {
      true: "ring-2 ring-surface",
    },
  },
})

interface AvatarProps {
  /** Sem nome: círculo tracejado com "?" (tarefa sem responsável). */
  name?: string | null
  /** 22–40px. */
  size?: number
  /** Anel da cor da superfície, para a pilha sobreposta. */
  ring?: boolean
  className?: string
}

/**
 * Iniciais sobre um tom pastel fixo por pessoa (DS v2, Avatar). Sem foto até
 * existir upload de avatar no backend.
 */
export function Avatar({ name, size = 32, ring, className }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    "--hue": name ? avatarHue(name) : undefined,
  } as CSSProperties

  return (
    <span
      className={avatar({ empty: !name, ring, className })}
      style={style}
      title={name ?? undefined}
      aria-label={name ?? undefined}
      role={name ? "img" : undefined}
    >
      {name ? initials(name) : "?"}
    </span>
  )
}
