/**
 * Regras de senha do cadastro e da redefinição — as mesmas que o backend
 * exige. Moram aqui para o schema e a lista que marca cada regra enquanto o
 * usuário digita não divergirem.
 */
export const PASSWORD_RULES = [
  { key: "length", test: (value: string) => value.length >= 6 },
  { key: "upper", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lower", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", test: (value: string) => /[0-9]/.test(value) },
  { key: "symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const

export type PasswordRuleKey = (typeof PASSWORD_RULES)[number]["key"]
