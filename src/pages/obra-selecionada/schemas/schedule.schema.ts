import { z } from "zod"

/**
 * Validação do formulário do Schedule.
 *
 * Espelha o que `ScheduleService` recusa com 400 — errar aqui vira uma
 * mensagem de servidor em inglês que o usuário não entende.
 *
 * As mensagens são **chaves de i18n**, não texto pronto como nos schemas mais
 * antigos deste diretório: rótulo de erro é texto de UI (CLAUDE.md §18) e a
 * view o renderiza com `t(error.message)` no próprio campo.
 */

const MAX_HOURS_PER_DAY = 24
const MAX_RESPONSIBILITY_LENGTH = 100

/**
 * O backend aceita no máximo 2 casas. A comparação é com tolerância porque
 * `0.07 * 100` dá 7.000000000000001 em ponto flutuante — um `% 1 === 0` cru
 * reprovaria um valor perfeitamente válido.
 */
function hasAtMostTwoDecimals(hours: number): boolean {
  const cents = hours * 100
  return Math.abs(cents - Math.round(cents)) < 1e-9
}

export const allocationSchema = z.object({
  // 0 é válido e significa "liberar o dia" — o hook converte isso em DELETE,
  // porque no banco `hours` tem CHECK (hours > 0) e dia livre é ausência de
  // linha.
  //
  // O campo é registrado com `valueAsNumber`, então um input vazio chega como
  // NaN e cai na mensagem de obrigatório — melhor que `coerce`, que leria ""
  // como 0 e apagaria a alocação sem o usuário ter pedido.
  allocatedHours: z
    .number({ message: "obra.schedule.errors.hoursRequired" })
    .min(0, "obra.schedule.errors.hoursRange")
    .max(MAX_HOURS_PER_DAY, "obra.schedule.errors.hoursRange")
    .refine(hasAtMostTwoDecimals, "obra.schedule.errors.hoursDecimals"),
})

export type AllocationFormData = z.infer<typeof allocationSchema>

export const responsibilitySchema = z.object({
  userResponsibility: z
    .string()
    .trim()
    .max(MAX_RESPONSIBILITY_LENGTH, "obra.schedule.errors.responsibilityLength"),
})

export type ResponsibilityFormData = z.infer<typeof responsibilitySchema>
