import type { FieldErrors } from "react-hook-form"

export function getFirstFormErrorMessage(errors: FieldErrors): string | undefined {
  for (const error of Object.values(errors)) {
    // Só objeto desce na recursão. Um `FieldError` sem `message` (ex.: regra
    // `required` sem texto) tem `type: "required"` como valor string, e uma
    // string é indexável e iterável: descer nela leva a "required" → "r" →
    // "r" → ... até estourar a pilha e derrubar a tela em vez de mostrar o
    // erro de validação.
    if (!error || typeof error !== "object") continue
    if (typeof error.message === "string") return error.message

    const nestedMessage = getFirstFormErrorMessage(error as FieldErrors)
    if (nestedMessage) return nestedMessage
  }

  return undefined
}