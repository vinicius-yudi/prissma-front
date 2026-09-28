import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"

import type { AvailableUser } from "../../types/equipes"

const option = tv({
  base: "flex w-full cursor-pointer items-center gap-3 rounded-[12px] p-3 text-left transition-shadow",
  variants: { selected: { true: "bg-gold-soft/60 inset-ring-2 inset-ring-gold", false: "hover:bg-raised" } },
})

interface CandidateListProps {
  users: AvailableUser[]
  isLoading: boolean
  /** Há busca digitada — muda o texto do vazio. */
  searching: boolean
  selectedId: number | null
  onSelect: (user: AvailableUser) => void
}

/** Quem da conta pode entrar na obra: carregando, vazio ou a lista. */
export function CandidateList({ users, isLoading, searching, selectedId, onSelect }: CandidateListProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-ink-3" aria-busy="true">
        <Loader2 className="animate-spin" size={20} />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <p className="rounded-md bg-raised p-6 text-center text-[13.5px] text-ink-2">
        {searching ? t("obra.equipes.addModal.noResults") : t("obra.equipes.addModal.noneAvailable")}
      </p>
    )
  }

  return (
    <div role="listbox" aria-label={t("obra.equipes.addModal.available")} className="grid max-h-64 gap-1 overflow-y-auto">
      {users.map((user) => (
        <button key={user.id} type="button" role="option" aria-selected={selectedId === user.id} onClick={() => onSelect(user)} className={option({ selected: selectedId === user.id })}>
          <Avatar name={user.name} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-[600] text-ink">{user.name}</span>
            <span className="block truncate text-[12.5px] text-meta">{user.email}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
