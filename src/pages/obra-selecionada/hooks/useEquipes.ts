import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { toast } from "react-toastify"
import {
  addEquipeMember,
  getEquipeMembers,
  removeEquipeMember,
  getAvailableUsers,
} from "../services/equipes.service"
import type { AddMemberRequest, RoleInProject } from "../types/equipes"

const RESULTS_PER_PAGE = 5

function isClient(role: string): boolean {
  return role === 'USER'
}

function isCollaborator(role: string): boolean {
  return role !== 'USER' && role !== 'ADMIN'
}

export function useEquipes(obraId: number) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleInProject>("ENGINEER")
  const [clientOffset, setClientOffset] = useState(0)
  const [collaboratorOffset, setCollaboratorOffset] = useState(0)

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ["equipes", obraId],
    queryFn: () => getEquipeMembers(obraId),
  })

  const {
    data: availableUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["availableUsers"],
    queryFn: getAvailableUsers,
  })

  const memberIds = new Set(members.map((m) => m.user.id))
  
  const baseFilteredUsers = useMemo(() => {
    return availableUsers.filter(
      (user) =>
        !memberIds.has(user.id) && user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [availableUsers, memberIds, searchQuery])
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
      queryClient.invalidateQueries({ queryKey: ["equipes", obraId] })
      toast.success("Membro adicionado à equipe com sucesso!")
      setSelectedUserId(null)
      setSearchQuery("")
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(`Erro ao adicionar membro: ${message}`)
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => removeEquipeMember(obraId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipes", obraId] })
      toast.success("Membro removido da equipe com sucesso!")
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(`Erro ao remover membro: ${message}`)
    },
  })

  function handleAddMember(role?: RoleInProject) {
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
