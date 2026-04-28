import { useQuery } from "@tanstack/react-query"

import {
  getProject,
  getProjectAcompanhamento,
} from "@/pages/projetos/services/projects.service"

export function useObraSelecionada(id: number) {
  const isValid = id > 0

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: isValid,
  })

  const acompQuery = useQuery({
    queryKey: ["acompanhamento", id],
    queryFn: () => getProjectAcompanhamento(id),
    enabled: isValid,
  })

  return { projectQuery, acompQuery }
}
