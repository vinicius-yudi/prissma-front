import type { FieldErrors } from "react-hook-form"

export function getFirstFormErrorMessage(errors: FieldErrors): string | undefined {
  for (const error of Object.values(errors)) {
    if (!error) continue
    if (typeof error.message === "string") return error.message

    const nestedMessage = getFirstFormErrorMessage(error as FieldErrors)
    if (nestedMessage) return nestedMessage
  }

  return undefined
}