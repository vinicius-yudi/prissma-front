import { useQuery } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"
import { Select } from "@/shared/components/ui/select/Select"

import { useRolePermissions } from "../hooks/useRolePermissions"
import { getEquipeMembers } from "../services/equipes.service"
import { EDITABLE_PROJECT_ROLES, ProjectRole } from "../services/projectPermissions.service"
import { RolePermissionsEditor } from "./RolePermissionsEditor"

/**
 * Pessoas & papéis (nível 2).
 *
 * Tabela de vinculados à obra + painel de permissões do papel selecionado,
 * como na tela 9 da spec. O painel reusa o <RolePermissionsEditor>, que já
 * existia dentro de um modal — aqui ele ganha a página que o design pede.
 *
 * A inclusão e remoção de integrantes continua em Equipes, onde a lógica já
 * vive; esta tela cuida de papel e permissão.
 */

interface PessoasTabProps {
  projectId: number
}

export function PessoasTab({ projectId }: PessoasTabProps) {
  const { t } = useTranslation()
  const [role, setRole] = useState<ProjectRole>(ProjectRole.ENGINEER)

  const membersQuery = useQuery({
    queryKey: ["equipes", projectId],
    queryFn: () => getEquipeMembers(projectId),
  })

  const { permissions, isLoading, isError } = useRolePermissions(projectId, role)

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    setRole(event.currentTarget.value as ProjectRole)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h2 className="text-base font-semibold text-on-surface">{t("pessoas.membersTitle")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("pessoas.membersHint")}</p>

        {membersQuery.isLoading && (
          <div className="mt-5 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
            ))}
          </div>
        )}

        {membersQuery.isError && (
          <p className="mt-6 text-sm text-danger">{t("pessoas.membersError")}</p>
        )}

        {membersQuery.data?.length === 0 && (
          <p className="mt-6 text-sm text-on-surface-variant">{t("pessoas.membersEmpty")}</p>
        )}

        <ul className="mt-4 divide-y divide-outline-variant">
          {membersQuery.data?.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                {member.user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-on-surface">
                  {member.user.name}
                </span>
                <span className="block truncate text-xs text-on-surface-variant">
                  {member.user.email}
                </span>
              </span>
              <RoleChip role={member.roleInProject} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h2 className="text-base font-semibold text-on-surface">{t("pessoas.permissionsTitle")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("pessoas.permissionsHint")}</p>

        <div className="mt-4">
          <Select value={role} onChange={handleRoleChange}>
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

          {isError && <p className="py-8 text-center text-sm text-danger">{t("pessoas.permissionsError")}</p>}

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
    </div>
  )
}
