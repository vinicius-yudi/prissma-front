import {
  ChevronDown,
  ChevronRight,
  Loader,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"
import { Select } from "@/shared/components/ui/select/Select"
import { isClientRole, isCollaboratorRole } from "@/shared/types/user"

import { useEquipes } from "../hooks/useEquipes"
import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { useRolePermissions } from "../hooks/useRolePermissions"
import {
  EDITABLE_PROJECT_ROLES,
  ProjectPermission,
  ProjectRole,
} from "../services/projectPermissions.service"
import { RoleInProject, type ConstructionProjectMember, type ProjectRoleInRequest } from "../types/equipes"
import { RolePermissionsEditor } from "./RolePermissionsEditor"

/**
 * Equipes da obra (Telas §14).
 *
 * Dois grupos recolhíveis — a equipe de execução, aberta por padrão, e os
 * clientes. As frentes nomeadas do protótipo ("Elétrica", "Alvenaria") não
 * existem no backend, que só guarda vínculo + papel; inventar frentes daria
 * uma tela bonita e mentirosa.
 *
 * Integrante é chip, não card: o que importa da pessoa aqui é quem ela é e o
 * papel dela — cards de 80px de avatar cabiam quatro por tela e transformavam
 * uma equipe de dez em rolagem.
 *
 * Permissões **não** ficam aqui. Editar a matriz de papéis é o assunto de
 * "Pessoas & papéis"; ter os dois caminhos era o que fazia os rótulos de papel
 * divergirem entre as telas. Sobra o atalho.
 */

const SECTIONS = ["team", "client"] as const
type SectionKey = (typeof SECTIONS)[number]

const userOption = tv({
  base: "rounded-2xl border p-4 text-left transition-colors",
  variants: {
    selected: {
      true: "border-gold bg-tint",
      false: "border-outline-variant bg-surface-container hover:border-outline",
    },
  },
})

const sectionIcon = tv({
  base: "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
  variants: {
    section: {
      team: "bg-gold text-on-primary",
      client: "bg-surface-container-high text-on-surface-variant",
    },
  },
})

interface MemberChipProps {
  member: ConstructionProjectMember
  canRemove: boolean
  onRemove: (member: ConstructionProjectMember) => void
}

function MemberChip({ member, canRemove, onRemove }: MemberChipProps) {
  const { t } = useTranslation()

  return (
    <span className="group flex max-w-full items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high py-1.5 pl-1.5 pr-3">
      {member.user.avatar ? (
        <img
          src={member.user.avatar}
          alt=""
          className="size-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container text-[9.5px] font-bold text-on-surface-variant">
          {member.user.name.slice(0, 2).toUpperCase()}
        </span>
      )}

      <span className="min-w-0 truncate text-[12.5px] text-on-surface">{member.user.name}</span>
      <RoleChip role={member.roleInProject} />

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member)}
          aria-label={t("obra.equipes.actions.remove", { name: member.user.name })}
          // Sempre visível no toque, onde não existe hover; no desktop aparece
          // ao passar o mouse para o chip não virar uma fileira de ✕.
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-faint transition-colors hover:bg-danger-bg hover:text-danger focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <X size={13} />
        </button>
      )}
    </span>
  )
}

interface SectionProps {
  section: SectionKey
  members: ConstructionProjectMember[]
  canManage: boolean
  expanded: boolean
  onToggle: () => void
  onAdd: () => void
  onRemove: (member: ConstructionProjectMember) => void
}

function MemberSection({
  section,
  members,
  canManage,
  expanded,
  onToggle,
  onAdd,
  onRemove,
}: SectionProps) {
  const { t } = useTranslation()
  const Icon = section === "team" ? Users : UserRound
  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-3 text-left"
      >
        <Chevron size={14} className="shrink-0 text-on-surface-faint" />
        <span className={sectionIcon({ section })}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-on-surface">
            {t(`obra.equipes.sections.${section}.title`)}
          </span>
          <span className="block truncate text-[11.5px] text-on-surface-faint">
            {t(`obra.equipes.sections.${section}.hint`)}
          </span>
        </span>
        <Num className="shrink-0 text-[11.5px] text-on-surface-variant">
          {t("obra.equipes.memberCount", { count: members.length })}
        </Num>
      </button>

      {expanded && (
        <div className="mt-4 flex flex-wrap gap-2 sm:pl-[62px]">
          {members.map((member) => (
            <MemberChip
              key={member.id}
              member={member}
              // O dono da obra não se remove da própria obra.
              canRemove={canManage && member.roleInProject !== RoleInProject.OWNER}
              onRemove={onRemove}
            />
          ))}

          {canManage && (
            <button
              type="button"
              onClick={onAdd}
              className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-outline px-4 text-[12.5px] font-semibold text-gold-bright transition-colors hover:bg-tint"
            >
              <Plus size={14} />
              {t(`obra.equipes.sections.${section}.add`)}
            </button>
          )}

          {members.length === 0 && !canManage && (
            <p className="text-[13px] text-on-surface-variant">{t("obra.equipes.empty")}</p>
          )}
        </div>
      )}
    </section>
  )
}

interface EquipesTabProps {
  obraId: number
}

/**
 * Permissões por papel DESTA OBRA. Morava na tela "Pessoas & papéis" do nível
 * 2; com o Workspace, Pessoas subiu para o nível 1 (equipe da construtora) e
 * o editor por obra veio para cá, junto do resto da gestão de equipe.
 */
function RolePermissionsPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const [role, setRole] = useState<ProjectRole>(ProjectRole.ENGINEER)
  const { permissions, isLoading, isError } = useRolePermissions(projectId, role)

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-5">
      <h2 className="text-base font-semibold text-on-surface">{t("pessoas.permissionsTitle")}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{t("pessoas.permissionsHint")}</p>

      <div className="mt-4 max-w-xs">
        <Select
          value={role}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setRole(event.currentTarget.value as ProjectRole)
          }
        >
          {EDITABLE_PROJECT_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-on-surface-variant">
            <Loader className="animate-spin" size={22} />
          </div>
        )}

        {isError && (
          <p className="py-8 text-center text-sm text-danger">{t("pessoas.permissionsError")}</p>
        )}

        {!isLoading && !isError && (
          <RolePermissionsEditor
            key={role}
            projectId={projectId}
            role={role}
            initialPermissions={permissions}
          />
        )}
      </div>
    </section>
  )
}

export function EquipesTab({ obraId }: EquipesTabProps) {
  const { t } = useTranslation()

  const [memberToRemove, setMemberToRemove] = useState<ConstructionProjectMember | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<SectionKey>("team")
  const [selectedRoleInAdd, setSelectedRoleInAdd] = useState<ProjectRoleInRequest>(RoleInProject.ENGINEER)
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    team: true,
    client: false,
  })

  const { can, isAdmin } = useProjectPermissions(obraId)
  // O `isAdmin` alinha esta tela com o kanban: sem ele um ADMIN global que não
  // é membro da obra ficava sem nenhuma ação.
  const canManageMembers = isAdmin || can(ProjectPermission.MANAGE_MEMBERS)

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

  function openAddModal(section: SectionKey) {
    setSelectedSection(section)
    setSearchQuery("")
    setSelectedUserId(null)
    setSelectedRoleInAdd(RoleInProject.ENGINEER)
    setExpanded((prev) => ({ ...prev, [section]: true }))
    setAddOpen(true)
  }

  // Antes do early return de loading: alimenta o FAB da barra de abas.
  usePrimaryAction(
    canManageMembers
      ? {
          label: t("obra.equipes.actions.addMember"),
          shortLabel: t("obra.equipes.actions.addMemberShort"),
          onClick: () => openAddModal("team"),
        }
      : null,
  )

  function closeAddModal() {
    setAddOpen(false)
    setSearchQuery("")
    setSelectedUserId(null)
  }

  function handleConfirmRemove() {
    if (!memberToRemove) return
    handleRemoveMember(memberToRemove.id)
    setMemberToRemove(null)
  }

  function handleConfirmAdd() {
    handleAddMember(selectedSection === "client" ? RoleInProject.USER : selectedRoleInAdd)
    closeAddModal()
  }

  if (isLoadingMembers) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container-low" />
        ))}
      </div>
    )
  }

  const bySection: Record<SectionKey, ConstructionProjectMember[]> = {
    team: members.filter((m) => isCollaboratorRole(m.user.role)),
    client: members.filter((m) => isClientRole(m.user.role)),
  }

  const userList =
    selectedSection === "client"
      ? filteredAvailableUsers.clients
      : filteredAvailableUsers.collaborators
  const hasMore = selectedSection === "client" ? clientsHasMore : collaboratorsHasMore
  const loadMore = selectedSection === "client" ? loadMoreClients : loadMoreCollaborators

  return (
    <div className="space-y-4">
      {SECTIONS.map((section) => (
        <MemberSection
          key={section}
          section={section}
          members={bySection[section]}
          canManage={canManageMembers}
          expanded={expanded[section]}
          onToggle={() => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))}
          onAdd={() => openAddModal(section)}
          onRemove={setMemberToRemove}
        />
      ))}

      {/* Editar a matriz de papéis desta obra exige gerir membros — mesma
          permissão que o backend cobra no PUT. */}
      {canManageMembers && <RolePermissionsPanel projectId={obraId} />}

      <Modal
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title={t("obra.equipes.removeModal.title")}
        description={t("obra.equipes.removeModal.message", {
          name: memberToRemove?.user.name ?? "",
        })}
        icon={<X size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" onClick={() => setMemberToRemove(null)} disabled={isRemovingMember}>
            {t("obra.equipes.actions.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirmRemove} disabled={isRemovingMember}>
            {isRemovingMember && <Loader size={16} className="animate-spin" />}
            {isRemovingMember
              ? t("obra.equipes.removeModal.removing")
              : t("obra.equipes.removeModal.confirm")}
          </Button>
        </div>
      </Modal>

      <Modal
        open={addOpen}
        onClose={closeAddModal}
        title={t(`obra.equipes.addModal.${selectedSection}.title`)}
        description={t(`obra.equipes.addModal.${selectedSection}.hint`)}
        icon={<Search size={20} />}
        size="lg"
      >
        <div className="space-y-6 px-6 pb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("obra.equipes.addModal.searchPlaceholder")}
            prefix={<Search size={16} />}
            disabled={isLoadingUsers}
          />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-on-surface">
              {t("obra.equipes.addModal.available")}
            </p>

            <div className="grid max-h-72 gap-3 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin" size={20} />
                </div>
              ) : userList.length === 0 ? (
                <p className="rounded-2xl border border-outline-variant bg-surface-container p-6 text-center text-sm text-on-surface-variant">
                  {searchQuery
                    ? t(`obra.equipes.addModal.${selectedSection}.noResults`)
                    : t(`obra.equipes.addModal.${selectedSection}.noneAvailable`)}
                </p>
              ) : (
                <>
                  {userList.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={userOption({ selected: selectedUserId === user.id })}
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="size-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container-high text-[12px] font-bold text-on-surface-variant">
                            {user.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-on-surface">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {hasMore && (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="rounded-2xl border border-outline-variant bg-surface-container p-4 text-center text-sm font-semibold text-gold-bright transition-colors hover:bg-surface-container-high"
                    >
                      {t("obra.equipes.addModal.loadMore")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {selectedUserId && selectedSection === "team" && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-on-surface">
                {t("obra.equipes.addModal.roleLabel")}
              </p>
              <Select
                value={selectedRoleInAdd}
                onChange={(e) => setSelectedRoleInAdd(e.currentTarget.value as ProjectRoleInRequest)}
              >
                <option value={RoleInProject.ENGINEER}>{t("roles.ENGINEER")}</option>
                <option value={RoleInProject.ARCHITECT}>{t("roles.ARCHITECT")}</option>
                <option value={RoleInProject.FOREMAN}>{t("roles.FOREMAN")}</option>
                <option value={RoleInProject.USER}>{t("roles.USER")}</option>
              </Select>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={closeAddModal} disabled={isAddingMember}>
              {t("obra.equipes.actions.cancel")}
            </Button>
            <Button onClick={handleConfirmAdd} disabled={!selectedUserId || isAddingMember}>
              {isAddingMember && <Loader size={16} className="animate-spin" />}
              {isAddingMember
                ? t("obra.equipes.addModal.adding")
                : t("obra.equipes.addModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
