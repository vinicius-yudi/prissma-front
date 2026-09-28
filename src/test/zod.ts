import type { ZodType } from "zod"

/**
 * Utilidades para testar schemas do Zod.
 *
 * Existem por um detalhe de tipagem: `error.flatten().fieldErrors` é tipado
 * com as chaves EXATAS do schema, então indexá-lo por uma `string` qualquer é
 * erro de compilação (TS7053) — e o `tsc -b` do CI reprova. Cada arquivo de
 * teste escrevendo o próprio `as` para contornar isso seria a mesma linha
 * repetida em todo schema do projeto.
 */

type FieldErrors = Record<string, string[] | undefined>

/** Primeira mensagem de erro de um campo, ou `undefined` se ele passou. */
export function fieldError(schema: ZodType, data: unknown, field: string): string | undefined {
  const result = schema.safeParse(data)
  if (result.success) return undefined
  return (result.error.flatten().fieldErrors as FieldErrors)[field]?.[0]
}

/**
 * Nomes dos campos que falharam, em ordem alfabética.
 *
 * Serve para conferir os `*_FORM_DEFAULTS`: eles alimentam o `useForm`, e um
 * default que falha num campo inesperado abre o formulário já inválido, com o
 * botão de salvar desabilitado sem o usuário ter digitado nada.
 */
export function failedFields(schema: ZodType, data: unknown): string[] {
  const result = schema.safeParse(data)
  if (result.success) return []
  return Object.keys(result.error.flatten().fieldErrors).sort()
}
