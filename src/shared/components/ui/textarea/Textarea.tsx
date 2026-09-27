import { forwardRef, type TextareaHTMLAttributes } from "react"
import { tv } from "tailwind-variants"

/**
 * Campo de texto longo.
 *
 * Espelha o <Input> (mesma superfície, raio, borda e anel de foco) porque os
 * dois convivem no mesmo formulário — descrição de tarefa embaixo do título — e
 * cada `<textarea>` cru que apareceu por aí escolheu o próprio raio e o próprio
 * fundo.
 */
const textarea = tv({
  base: "w-full resize-y rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-2 focus:border-gold focus:ring-2 focus:ring-gold/30",
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={textarea({ className })} {...props} />
  },
)
