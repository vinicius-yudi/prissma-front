import { useState } from 'react'
import { Button } from '@/shared/components/ui/button/Button'
import { Input } from '@/shared/components/ui/input/Input'
import { Modal } from '@/shared/components/ui/modal/Modal'
import { CirclePlus, CircleX, Mail, Search, Loader, ShieldCheck } from 'lucide-react'
import { useEquipes } from '../hooks/useEquipes'
import { useProjectPermissions } from '../hooks/useProjectPermissions'
import { ProjectPermission } from '../services/projectPermissions.service'
import type { ConstructionProjectMember, RoleInProject } from '../types/equipes'
import { RolePermissionsModal } from './RolePermissionsModal'

interface EquipesTabProps {
  obraId: number
}

function isClient(role: string): boolean {
  return role === 'USER'
}

function isCollaborator(role: string): boolean {
  return role !== 'USER' && role !== 'ADMIN'
}

export function EquipesTab({ obraId }: EquipesTabProps) {
  const [memberToRemove, setMemberToRemove] = useState<ConstructionProjectMember | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [permsOpen, setPermsOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<'client' | 'team'>('team')
  const [selectedRoleInAdd, setSelectedRoleInAdd] = useState<RoleInProject>('ENGINEER')

  const { can } = useProjectPermissions(obraId)
  const canManageMembers = can(ProjectPermission.MANAGE_MEMBERS)

  const {
    members,
    isLoadingMembers,
    filteredAvailableUsers,
    isLoadingUsers,
    searchQuery,
    setSearchQuery,
    selectedUserId,
    setSelectedUserId,
    handleAddMember,
    handleRemoveMember,
    isAddingMember,
    isRemovingMember,
    loadMoreClients,
    loadMoreCollaborators,
    clientsHasMore,
    collaboratorsHasMore,
  } = useEquipes(obraId, addOpen && canManageMembers)

  function openRemoveModal(member: ConstructionProjectMember) {
    setMemberToRemove(member)
  }

  function closeRemoveModal() {
    setMemberToRemove(null)
  }

  function openAddModal(section: 'client' | 'team') {
    setSelectedSection(section)
    setSearchQuery('')
    setSelectedUserId(null)
    setSelectedRoleInAdd(section === 'client' ? 'CLIENT' : 'ENGINEER')
    setAddOpen(true)
  }

  function closeAddModal() {
    setAddOpen(false)
    setSearchQuery('')
    setSelectedUserId(null)
  }

  function handleConfirmRemove() {
    if (memberToRemove) {
      handleRemoveMember(memberToRemove.id)
      closeRemoveModal()
    }
  }

  function handleConfirmAdd() {
    if (selectedSection === 'client') {
      handleAddMember('USER' as RoleInProject)
    } else {
      handleAddMember(selectedRoleInAdd)
    }
    closeAddModal()
  }

  function mapRoleLabel(role: RoleInProject | string) {
    switch (role) {
      case 'ENGINEER':
        return 'Engenheiro'
      case 'ARCHITECT':
        return 'Arquiteto'
      case 'FOREMAN':
        return 'Externo'
      case 'OWNER':
        return 'Proprietário'
      case 'USER':
        return 'Cliente'
      default:
        return role
    }
  }

  if (isLoadingMembers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin" size={24} />
      </div>
    )
  }

  return (
    <>
      <div className="p-2">
        {canManageMembers && (
          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              className="w-auto px-4 py-2 text-sm"
              onClick={() => setPermsOpen(true)}
            >
              <ShieldCheck size={16} />
              Permissões
            </Button>
          </div>
        )}

        {/* SEÇÃO CLIENTE */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-headline font-bold text-on-surface tracking-tight flex items-center gap-3">
              <span className="w-1 h-6 bg-secondary rounded-full" />
              Cliente
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {members
              .filter((m) => isClient(m.user.role))
              .map((member) => (
                <div
                  key={member.id}
                  className="border-2 border-outline-variant/60 rounded-xl p-6 group relative overflow-hidden">
                  {canManageMembers && (
                    <div className="absolute top-0 right-0 p-4">
                      <Button
                        variant="ghost"
                        className="p-2 text-error hover:bg-error/10 rounded-full transition-all"
                        disabled={isRemovingMember}
                        onClick={() => openRemoveModal(member)}>
                        <CircleX className="text-[18px]" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    <img
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 p-1"
                      alt={member.user.name}
                      src={member.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'}
                    />
                    <div className="flex-1">
                      <h3 className="text-title-lg font-bold text-on-surface">{member.user.name}</h3>
                      <div className="space-y-2">
                        <div className="block gap-1 text-body-md text-on-surface-variant">
                          <Mail className="inline-block h-[1em] w-[1em] shrink-0 mr-1" />
                          <span>{member.user.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {canManageMembers && (
              <button
                type="button"
                onClick={() => openAddModal('client')}
                className="border-2 border-dashed border-outline-variant/60 rounded-xl p-6 flex flex-col items-center justify-center text-on-surface-variant/50 hover:border-primary/50 hover:text-primary transition-all cursor-pointer group"
              >
                <CirclePlus className="w-6 h-6 sm:w-8 sm:h-8 mb-2 shrink-0" />
                <span className="text-[10px] sm:text-label-sm font-bold uppercase tracking-widest text-center">
                  Adicionar Cliente
                </span>
              </button>
            )}
          </div>
        </section>

        {/* SEÇÃO EQUIPE */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-headline font-bold text-on-surface tracking-tight flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Equipe
            </h2>
            <span className="text-sm text-on-surface-variant">
              {(() => {
                const collaborators = members.filter((m) => isCollaborator(m.user.role))
                return `${collaborators.length} ${collaborators.length === 1 ? 'membro' : 'membros'}`
              })()}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {members.filter((m) => isCollaborator(m.user.role))
            .map((member) => (
              <div
                key={member.id}
                className="border-2 border-outline-variant/60 rounded-xl p-6 group relative overflow-hidden">
                {canManageMembers && (
                  <div className="absolute top-0 right-0 p-4">
                    <Button
                      variant="ghost"
                      className="p-2 text-error hover:bg-error/10 rounded-full transition-all"
                      disabled={isRemovingMember}
                      onClick={() => openRemoveModal(member)}>
                      <CircleX className="text-[18px]" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <img
                    className="w-16 h-16 rounded-full object-cover border border-outline-variant/30"
                    alt={member.user.name}
                    src={member.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'}
                  />
                  <div className="flex-1">
                    <h3 className="text-title-lg font-bold text-on-surface">{member.user.name}</h3>
                    <div className="flex items-center gap-2 my-0.5">
                      <span className="bg-surface-container-highest text-secondary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                        {mapRoleLabel(member.roleInProject)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="block gap-1 text-body-md text-on-surface-variant">
                        <Mail className="inline-block h-[1em] w-[1em] shrink-0 mr-1" />
                        <span>{member.user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {canManageMembers && (
            <button
              type="button"
              onClick={() => openAddModal('team')}
              className="border-2 border-dashed border-outline-variant/60 rounded-xl p-6 flex flex-col items-center justify-center text-on-surface-variant/50 hover:border-primary/50 hover:text-primary transition-all cursor-pointer group"
            >
              <CirclePlus className="w-6 h-6 sm:w-8 sm:h-8 mb-2 shrink-0" />
              <span className="text-[10px] sm:text-label-sm font-bold uppercase tracking-widest text-center">
                Adicionar Colaborador
              </span>
            </button>
          )}
        </div>
        </section>
      </div>

      {/* Modal para remover membro */}
      <Modal
        open={!!memberToRemove}
        onClose={closeRemoveModal}
        title="Remover pessoa"
        description={`Tem certeza que deseja remover ${memberToRemove?.user.name}?`}
        icon={<CircleX size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="px-6 pb-6 space-y-5">
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeRemoveModal} disabled={isRemovingMember}>
              Cancelar
            </Button>
            <Button
              className="bg-error text-on-error border-0 hover:brightness-[0.92]"
              onClick={handleConfirmRemove}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para adicionar membro */}
      <Modal
        open={addOpen}
        onClose={closeAddModal}
        title={selectedSection === 'client' ? 'Adicionar cliente' : 'Adicionar colaborador'}
        description={selectedSection === 'client' 
          ? "Procure e selecione um cliente para adicionar." 
          : "Procure e selecione um colaborador para adicionar."}
        icon={<Search size={20} />}
        variant="default"
        size="lg"
      >
        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise por nome ou e-mail..."
              prefix={<Search size={16} />}
              disabled={isLoadingUsers}
            />
          </div>

          {/* Lista de usuários disponíveis filtrados por tipo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-on-surface">Usuários disponíveis</label>
            <div className="grid gap-3 max-h-72 overflow-y-auto" id="user-list-container">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin" size={20} />
                </div>
              ) : (() => {
                const userList = selectedSection === 'client' 
                  ? filteredAvailableUsers.clients 
                  : filteredAvailableUsers.collaborators
                const hasMore = selectedSection === 'client' 
                  ? clientsHasMore 
                  : collaboratorsHasMore
                const loadMore = selectedSection === 'client'
                  ? loadMoreClients
                  : loadMoreCollaborators
                
                return userList.length > 0 ? (
                  <>
                    {userList.map((user) => {
                      const isSelected = selectedUserId === user.id
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-outline-variant/60 bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <img
                              className="w-12 h-12 rounded-full object-cover"
                              alt={user.name}
                              src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'}
                            />
                            <div>
                              <p className="font-semibold text-on-surface">{user.name}</p>
                              <p className="text-xs text-on-surface-variant">{user.email}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={loadMore}
                        className="rounded-2xl border border-outline-variant/60 bg-surface-container p-4 text-center text-sm font-semibold text-primary hover:bg-surface-container/80 transition-all"
                      >
                        Carregar mais resultados
                      </button>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-outline-variant/60 bg-surface-container p-6 text-sm text-on-surface-variant text-center">
                    {searchQuery 
                      ? `Nenhum ${selectedSection === 'client' ? 'cliente' : 'colaborador'} encontrado com este critério.` 
                      : `Nenhum ${selectedSection === 'client' ? 'cliente' : 'colaborador'} disponível para adicionar.`}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Seleção de papel (apenas para colaboradores) */}
          {selectedUserId && selectedSection === 'team' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface">Papel na obra</label>
              <select
                value={selectedRoleInAdd}
                onChange={(e) => setSelectedRoleInAdd(e.target.value as RoleInProject)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant/60 bg-surface-container text-on-surface"
              >
                <option value="ENGINEER">Engenheiro</option>
                <option value="ARCHITECT">Arquiteto</option>
                <option value="FOREMAN">Externo</option>
              </select>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeAddModal} disabled={isAddingMember}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAdd} disabled={!selectedUserId || isAddingMember}>
              {isAddingMember ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <RolePermissionsModal
        open={permsOpen}
        onClose={() => setPermsOpen(false)}
        projectId={obraId}
      />
    </>
  )
}

