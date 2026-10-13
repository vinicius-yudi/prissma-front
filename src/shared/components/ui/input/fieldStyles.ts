/**
 * Campo de texto (DS v2, Field): 44px, raio 10px, fundo `raised` com
 * hairline — a borda sozinha não chega a 3:1, o fundo preenchido é o que
 * marca o controle. Foco em 2px de ouro; `aria-invalid` em 2px de perigo.
 */
export const fieldBase = [
  "w-full rounded-[10px] bg-raised text-[14px] text-ink hairline outline-none",
  "placeholder:text-ink-3 transition-shadow",
  "focus:inset-ring-2 focus:inset-ring-gold",
  "aria-[invalid=true]:inset-ring-2 aria-[invalid=true]:inset-ring-danger",
  "disabled:cursor-not-allowed disabled:opacity-60",
]
