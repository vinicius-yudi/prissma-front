import { LayoutGroup } from "motion/react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { DeleteProjectModal } from "@/pages/projetos/components/DeleteProjectModal"
import { ProjectStepModal } from "@/pages/projetos/components/ProjectStepModal"
import type { Project } from "@/shared/types/project"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { useProjectPermissions } from "../../hooks/useProjectPermissions"
import { ProjectPermission } from "../../services/projectPermissions.service"
import { ObraHeaderCompact } from "./ObraHeaderCompact"
import { ObraHeaderFull } from "./ObraHeaderFull"

interface ObraHeaderProps {
  project: Project
  /** Visão geral mostra o cabeçalho grande; os módulos, a barra compacta. */
  full: boolean
  data: ObraHeaderData
}

/**
 * Cabeçalho da obra (DS v2, Tabs). Ao sair da Visão geral o cabeçalho grande
 * encolhe para a barra compacta — `LayoutGroup` com `layoutId` no bloco, no
 * título e na fachada faz os três animarem entre os dois tamanhos.
 *
 * Editar e excluir a obra ficam aqui (só no cabeçalho grande) e exigem
 * MANAGE_PROJECT, o mesmo gate do backend.
 */
export function ObraHeader({ project, full, data }: ObraHeaderProps) {
  const navigate = useNavigate()
  const { can } = useProjectPermissions(project.id)
  const canManage = can(ProjectPermission.MANAGE_PROJECT)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <LayoutGroup id="obra-header">
        {full ? (
          <ObraHeaderFull
            project={project}
            data={data}
            canManage={canManage}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : (
          <ObraHeaderCompact project={project} data={data} canManage={canManage} />
        )}
      </LayoutGroup>

      <ProjectStepModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <DeleteProjectModal
        project={deleteOpen ? project : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/obras")}
      />
    </>
  )
}
