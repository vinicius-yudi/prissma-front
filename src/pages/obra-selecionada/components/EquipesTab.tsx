import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { getMyProfile } from "@/shared/services/user.service"

import { useEquipes } from "../hooks/useEquipes"
import { usePermissionMatrix } from "../hooks/usePermissionMatrix"
import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { ALL_PROJECT_PERMISSIONS, ProjectPermission, type ProjectRole } from "../services/projectPermissions.service"
import { RoleInProject, type ProjectRoleInRequest } from "../types/equipes"
import { AddMemberModal } from "./equipes/AddMemberModal"
import { MembersPanel } from "./equipes/MembersPanel"
import { PermissionMatrix } from "./equipes/PermissionMatrix"

interface EquipesTabProps {
  obraId: number
}

/**
 * Equipe da obra (redesign): as pessoas com o papel de cada uma e a matriz de
 * papéis × permissões. Passar o cursor num papel da matriz esmaece quem não o
 * ocupa. As frentes nomeadas do protótipo ("Elétrica") não existem no backend,
 * que só guarda vínculo + papel — ficam de fora em vez de inventadas.
 */
export function EquipesTab({ obraId }: EquipesTabProps) {
  const { t } = useTranslation()
  const { can, isAdmin } = useProjectPermissions(obraId)
  // `isAdmin` alinha com o resto: ADMIN global que não é membro também gerencia.
  const canManage = isAdmin || can(ProjectPermission.MANAGE_MEMBERS)
  const [addOpen, setAddOpen] = useState(false)
  // Nova `key` a cada abertura: o modal remonta com a busca e a escolha zeradas.
  const [addKey, setAddKey] = useState(0)
  const [focusRole, setFocusRole] = useState<RoleInProject | null>(null)
  const equipes = useEquipes(obraId, addOpen && canManage)
  // Editar a matriz exige gerir membros — a mesma permissão que o PUT cobra.
  const matrix = usePermissionMatrix(obraId, canManage)
  const me = useQuery({ queryKey: ["me"], queryFn: getMyProfile })

  function openAdd() {
    setAddKey((k) => k + 1)
    setAddOpen(true)
  }

  // Antes do early return: alimenta a ação flutuante do celular.
  usePrimaryAction(canManage ? { label: t("obra.equipes.actions.addMember"), shortLabel: t("obra.equipes.actions.addMemberShort"), onClick: openAdd } : null)

  function permissionSummary(role: ProjectRoleInRequest): string | null {
    if (role === RoleInProject.USER || matrix.isLoading || matrix.isError) return null
    return t("obra.equipes.addModal.permissionCount", { count: matrix.matrix[role as ProjectRole].size, total: ALL_PROJECT_PERMISSIONS.length })
  }

  if (equipes.isLoadingMembers) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-lg bg-surface hairline" />
        <div className="h-72 animate-pulse rounded-lg bg-surface hairline" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <MembersPanel
        members={equipes.members}
        meId={me.data?.id ?? null}
        focusRole={focusRole}
        canManage={canManage}
        onInvite={openAdd}
        onRoleChange={equipes.changeRole}
        onRemove={equipes.remove}
      />

      {canManage && (
        <PermissionMatrix
          state={matrix}
          memberCount={(role) => equipes.members.filter((m) => m.roleInProject === role).length}
          focusRole={focusRole}
          onFocusRole={setFocusRole}
        />
      )}

      <AddMemberModal
        key={addKey}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        candidates={equipes.candidates}
        isLoading={equipes.isLoadingUsers}
        isAdding={equipes.isAdding}
        permissionSummary={permissionSummary}
        onAdd={(userId, role) => equipes.addAsync({ userId, roleInProject: role })}
      />
    </div>
  )
}
