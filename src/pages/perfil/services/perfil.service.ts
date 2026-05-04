import { api } from "@/lib/api"
import type { UserProfile } from "@/shared/types/user"
import type { UpdateProfilePayload } from "../types"

export async function updateProfile(id: number, payload: UpdateProfilePayload): Promise<UserProfile> {
  return api.patch<UserProfile>(`/users/${id}`, payload)
}

export async function deleteAccount(id: number): Promise<void> {
  return api.delete<void>(`/users/${id}`)
}
