import { AnimatePresence, motion } from "motion/react"
import { useId } from "react"
import type { ReactNode } from "react"

import { Label } from "../label/Label"

interface FieldProps {
  label: string
  /** Dica em `ink-3`; some enquanto houver erro. */
  hint?: string
  /** Mensagem que diz o que fazer ("O término precisa ser depois do início."). */
  error?: string
  /** Recebe o `id` que liga rótulo e controle. */
  children: (id: string) => ReactNode
  className?: string
}

/**
 * Rótulo + campo + dica ou erro (DS v2, Field).
 *
 * O controle chega por render prop para receber o `id` do rótulo sem que o
 * formulário invente um. O erro abre com altura animada — aparecer de estalo
 * empurra o formulário inteiro para baixo.
 */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId()

  return (
    <div className={className}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children(id)}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="error"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1.5 text-[12px] font-[560] text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {hint && !error && <p className="pt-1.5 text-[12px] text-meta">{hint}</p>}
    </div>
  )
}
