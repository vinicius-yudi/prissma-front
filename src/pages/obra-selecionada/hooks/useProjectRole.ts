import { useQuery } from "@tanstack/react-query"

import { getMyProfile } from "@/shared/services/user.service"

import {
  listProjectMembers,
  type ProjectRole,
} from "../services/projectMembers.service"

export interface UseProjectRoleResult {
  role: ProjectRole | null
  canMutate: boolean
  isLoading: boolean
}

export function useProjectRole(projectId: number): UseProjectRoleResult {
  const isValid = projectId > 0

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
  })

  const membersQuery = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => listProjectMembers(projectId),
    enabled: isValid,
  })

  const role =
    membersQuery.data?.find(m => m.userId === meQuery.data?.id)?.roleInProject ?? null

  const isLoading = meQuery.isLoading || membersQuery.isLoading

  // Fail-open: while loading, on member-endpoint error, or when the user isn't
  // listed but is authenticated, allow mutations so the UI doesn't gate on the
  // round-trip. The backend still enforces OWNER/ENGINEER and returns 403.
  const canMutate =
    isLoading ||
    role === "OWNER" ||
    role === "ENGINEER" ||
    membersQuery.isError ||
    (membersQuery.isSuccess && role === null)

  return {
    role,
    canMutate,
    isLoading,
  }
}
