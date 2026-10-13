import type { LucideIcon } from "lucide-react"

export interface Command {
  id: string
  /** Rótulo do grupo, já traduzido: "Ações", "Obras", "Tarefas". */
  group: string
  label: string
  /** Contexto à direita: bairro da obra, obra da tarefa. */
  hint?: string
  icon: LucideIcon
  run: () => void
  /** Só aparece com termo digitado — etapas e tarefas encheriam a lista vazia. */
  searchOnly?: boolean
}

const MAX_RESULTS = 40

/** Sem acento e em minúsculas: "merces" encontra "Mercês". */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function filterCommands(commands: Command[], query: string): Command[] {
  const term = normalize(query.trim())
  if (!term) return commands.filter((command) => !command.searchOnly).slice(0, MAX_RESULTS)

  return commands
    .filter((command) => normalize(`${command.label} ${command.hint ?? ""}`).includes(term))
    .slice(0, MAX_RESULTS)
}
