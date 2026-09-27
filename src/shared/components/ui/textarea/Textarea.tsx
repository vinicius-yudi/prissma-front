import { forwardRef, type TextareaHTMLAttributes } from "react"
import { tv } from "tailwind-variants"

import { fieldBase } from "../input/fieldStyles"

/**
 * Campo de texto longo.
 *
 * Espelha o <Input> (mesma superfície, raio, borda e anel de foco) porque os
 * dois convivem no mesmo formulário — descrição de tarefa embaixo do título — e
 * cada `<textarea>` cru que apareceu por aí escolheu o próprio raio e o próprio
 * fundo.
 */
const textarea = tv({
  base: [...fieldBase, "min-h-24 resize-y px-3.5 py-3 leading-relaxed"],
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={textarea({ className })} {...props} />
  },
)
