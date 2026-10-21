import { api } from "@/lib/api"

/** Preferência de interface salva no servidor (`/users/me/preferences/{key}`). */
export interface Preference<T> {
  key: string
  value: T
  updatedAt: string
}

/** Chaves aceitas pelo servidor (PreferenceKey no backend). */
export const PreferenceKeys = {
  PROJECT_OVERVIEW_LAYOUT: "obra.visao-geral.layout",
} as const

export type PreferenceKey = (typeof PreferenceKeys)[keyof typeof PreferenceKeys]

function path(key: PreferenceKey): string {
  return `/users/me/preferences/${encodeURIComponent(key)}`
}

/** `null` quando o usuário nunca salvou (204): quem chama usa o padrão. */
export async function getPreference<T>(key: PreferenceKey): Promise<Preference<T> | null> {
  const preference = await api.get<Preference<T> | undefined>(path(key))
  return preference ?? null
}

export function putPreference<T>(key: PreferenceKey, value: T): Promise<Preference<T>> {
  return api.put<Preference<T>>(path(key), value)
}

/** "Restaurar padrão": apaga o valor salvo. */
export function deletePreference(key: PreferenceKey): Promise<void> {
  return api.delete<void>(path(key))
}
