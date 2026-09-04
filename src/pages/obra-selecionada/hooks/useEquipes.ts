import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { toast } from "react-toastify"
import {
  addEquipeMember,
  getEquipeMembers,
  removeEquipeMember,
  getAvailableUsers,
} from "../services/equipes.service"
import type { AddMemberRequest, ProjectRoleInRequest } from "../types/equipes"
import { obraMembersKey } from "./useObraMembers"

const RESULTS_PER_PAGE = 5

// Papéis de WORKSPACE (a lista de disponíveis vem de /workspaces/members).
function isClient(role: string): boolean {
  return role === 'CLIENT'
}

function isCollaborator(role: string): boolean {
  return role === 'MEMBER'
}

export function useEquipes(obraId: number, usersEnabled = false) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProjectRoleInRequest>("ENGINEER")
  const [clientOffset, setClientOffset] = useState(0)
  const [collaboratorOffset, setCollaboratorOffset] = useState(0)

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: obraMembersKey(obraId),
    queryFn: () => getEquipeMembers(obraId),
  })

  const {
    data: availableUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["availableUsers"],
    queryFn: getAvailableUsers,
    // /workspaces/members é vetado a CLIENT no backend; só busca quando o
    // modal abre e o usuário pode gerenciar membros (opt-in do chamador).
    enabled: usersEnabled,
  })

  const baseFilteredUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user.id))
    return availableUsers.filter(
      (user) =>
        !memberIds.has(user.id) && user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [availableUsers, members, searchQuery])
  const clientUsers = useMemo(() => {
    return baseFilteredUsers.filter((user) => isClient(user.role))
  }, [baseFilteredUsers])

  const collaboratorUsers = useMemo(() => {
    return baseFilteredUsers.filter((user) => isCollaborator(user.role))
  }, [baseFilteredUsers])
  const paginatedClientUsers = clientUsers.slice(0, clientOffset + RESULTS_PER_PAGE)
  const paginatedCollaboratorUsers = collaboratorUsers.slice(0, collaboratorOffset + RESULTS_PER_PAGE)

  // Retorna os resultados com base na seção selecionada
  const filteredAvailableUsers = {
    clients: paginatedClientUsers,
    collaborators: paginatedCollaboratorUsers,
    allClients: clientUsers,
    allCollaborators: collaboratorUsers,
  }

  const loadMoreClients = () => {
    setClientOffset((prev) => prev + RESULTS_PER_PAGE)
  }

  const loadMoreCollaborators = () => {
    setCollaboratorOffset((prev) => prev + RESULTS_PER_PAGE)
  }

  // Reset pagination when search query changes
  const handleSearchQuery = (query: string) => {
    setSearchQuery(query)
    setClientOffset(0)
    setCollaboratorOffset(0)
  }

  const addMemberMutation = useMutation({
    mutationFn: (data: AddMemberRequest) => addEquipeMember(obraId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obraMembersKey(obraId) })
      toast.success("Membro adicionado à equipe com sucesso!")
      setSelectedUserId(null)
      setSearchQuery("")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar membro: ${error.message}`)
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => removeEquipeMember(obraId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obraMembersKey(obraId) })
      toast.success("Membro removido da equipe com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover membro: ${error.message}`)
    },
  })

  function handleAddMember(role?: ProjectRoleInRequest) {
    if (!selectedUserId) {
      toast.error("Selecione um usuário")
      return
    }

    const roleToSend = role ?? selectedRole

    addMemberMutation.mutate({
      userId: selectedUserId,
      roleInProject: roleToSend,
    })
  }

  function handleRemoveMember(memberId: number) {
    removeMemberMutation.mutate(memberId)
  }

  return {
    members,
    isLoadingMembers,
    membersError,
    filteredAvailableUsers,
    isLoadingUsers,
    searchQuery,
    setSearchQuery: handleSearchQuery,
    selectedUserId,
    setSelectedUserId,
    selectedRole,
    setSelectedRole,
    handleAddMember,
    handleRemoveMember,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    loadMoreClients,
    loadMoreCollaborators,
    clientsHasMore: paginatedClientUsers.length < clientUsers.length,
    collaboratorsHasMore: paginatedCollaboratorUsers.length < collaboratorUsers.length,
  }
}
