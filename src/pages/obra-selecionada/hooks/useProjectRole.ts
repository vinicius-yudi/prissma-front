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

  // Fail-open: if the members endpoint errors (e.g. not implemented yet) or the
  // current user isn't listed but is authenticated, allow mutations. The backend
  // still enforces the OWNER/ENGINEER check and returns 403 if not permitted.
  const canMutate =
    role === "OWNER" ||
    role === "ENGINEER" ||
    membersQuery.isError ||
    (membersQuery.isSuccess && role === null)

  return {
    role,
    canMutate,
    isLoading: meQuery.isLoading || membersQuery.isLoading,
  }
}
