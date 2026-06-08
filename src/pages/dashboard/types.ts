import type { Tarefa } from "@/pages/obra-selecionada/types/tarefas"

export interface DashboardTask extends Tarefa {
  projectTitle: string | null
}
