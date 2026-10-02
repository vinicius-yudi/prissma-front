/**
 * Matiz fixo por pessoa (0–359), derivado do nome.
 *
 * O DS prevê o matiz guardado no perfil; enquanto o backend não expõe esse
 * campo, um hash estável do nome dá o mesmo efeito — a pessoa tem a mesma cor
 * em todas as telas e sessões.
 */
export function avatarHue(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 360
}

/** Até duas iniciais: primeiro e último nome. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}
