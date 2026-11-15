import { Building2 } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import { Select } from "@/shared/components/ui/select/Select"

import type { AnalyticsProjectOption } from "../types/analytics"

const ALL = ""

interface ProjectFilterProps {
  projects: AnalyticsProjectOption[]
  /** `null` = "Todas as obras". */
  value: number | null
  onChange: (projectId: number | null) => void
}

/** Filtro "Obra" do dashboard consolidado. */
export function ProjectFilter({ projects, value, onChange }: ProjectFilterProps) {
  const { t } = useTranslation()

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value === ALL ? null : Number(event.target.value))
  }

  return (
    <Select
      aria-label={t("relatorios.filter.label")}
      prefix={<Building2 size={16} />}
      wrapperClassName="sm:w-72"
      value={value === null ? ALL : String(value)}
      onChange={handleChange}
    >
      <option value={ALL}>{t("relatorios.filter.all")}</option>
      {projects.map((project) => (
        <option key={project.projectId} value={project.projectId}>
          {project.projectTitle}
        </option>
      ))}
    </Select>
  )
}
