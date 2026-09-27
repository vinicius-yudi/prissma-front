import { CornerDownLeft } from "lucide-react"
import { motion } from "motion/react"
import { tv } from "tailwind-variants"

import type { Command } from "./commandSearch"

const row = tv({
  base: "relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 text-left text-[14px]",
  variants: {
    active: {
      true: "text-ink",
      false: "text-ink-2",
    },
  },
})

const icon = tv({
  base: "relative flex-none",
  variants: {
    active: {
      true: "text-gold-hi",
      false: "text-ink-3",
    },
  },
})

interface CommandItemProps {
  command: Command
  active: boolean
  onHover: () => void
}

/** Linha da busca ⌘K; o destaque desliza entre as linhas. */
export function CommandItem({ command, active, onHover }: CommandItemProps) {
  const Icon = command.icon

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={command.run}
      className={row({ active })}
    >
      {active && (
        <motion.span
          layoutId="palette-highlight"
          className="absolute inset-0 rounded-[10px] bg-raised"
          transition={{ type: "spring", stiffness: 600, damping: 40 }}
        />
      )}
      <Icon size={16} className={icon({ active })} />
      <span className="relative flex-1 truncate">{command.label}</span>
      {command.hint && <span className="relative truncate text-[12.5px] text-meta">{command.hint}</span>}
      {active && <CornerDownLeft size={14} className="relative text-ink-3" />}
    </button>
  )
}
