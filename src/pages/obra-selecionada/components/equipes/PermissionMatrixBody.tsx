import { Check, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { ALL_PROJECT_PERMISSIONS, EDITABLE_PROJECT_ROLES, type ProjectRole } from "../../services/projectPermissions.service"
import type { PermissionMatrixProps } from "./PermissionMatrix"

const header = tv({
  base: "px-2 py-3 text-center text-[12.5px] font-[620] transition-colors",
  variants: { focus: { true: "text-gold-hi", false: "text-ink-2" } },
})

const cell = tv({
  base: "px-2 py-2.5 text-center transition-colors group-hover:bg-raised",
  variants: { focus: { true: "bg-gold-soft/50" } },
})

const mark = tv({
  base: "inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:inset-ring-2 hover:inset-ring-gold",
  variants: {
    on: { true: "bg-gold-soft text-gold-hi", false: "text-ink-3/60" },
  },
})

/** Corpo da matriz: carregando, erro ou a tabela. */
export function PermissionMatrixBody({ state, memberCount, focusRole, onFocusRole }: PermissionMatrixProps) {
  const { t } = useTranslation()

  function focusProps(role: ProjectRole) {
    return { onMouseEnter: () => onFocusRole(role), onMouseLeave: () => onFocusRole(null) }
  }

  if (state.isLoading) return <div className="m-5 h-64 animate-pulse rounded-md bg-raised" aria-busy="true" />
  if (state.isError) return <p className="px-6 py-8 text-center text-[14px] text-danger">{t("obra.equipes.permissions.loadError")}</p>

  return (
    <div className="overflow-x-auto p-2 sm:p-3">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[13.5px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface px-3 py-3 text-left">
              <span className="sr-only">{t("obra.equipes.permissions.permission")}</span>
            </th>
            {EDITABLE_PROJECT_ROLES.map((role) => (
              <th key={role} scope="col" {...focusProps(role)} className={header({ focus: focusRole === role })}>
                <span className="block">{t(`roles.${role}`)}</span>
                <span className="t-num block text-[11px] font-[450] text-meta">{memberCount(role)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_PROJECT_PERMISSIONS.map((permission) => (
            <tr key={permission} className="group">
              <th scope="row" className="sticky left-0 rounded-l-[10px] bg-surface px-3 py-2.5 text-left font-[450] text-ink group-hover:bg-raised">
                {t(`obra.equipes.permissions.labels.${permission}`)}
              </th>
              {EDITABLE_PROJECT_ROLES.map((role) => {
                const on = state.matrix[role].has(permission)
                const label = t("obra.equipes.permissions.cell", { role: t(`roles.${role}`), permission: t(`obra.equipes.permissions.labels.${permission}`) })
                return (
                  <td key={role} {...focusProps(role)} className={cell({ focus: focusRole === role })}>
                    <button type="button" aria-pressed={on} aria-label={label} onClick={() => state.toggle(role, permission)} className={mark({ on })}>
                      {on ? <Check size={13} strokeWidth={3} /> : <Lock size={13} />}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
