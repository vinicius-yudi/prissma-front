export const TABS = ["visaoGeral", "etapas", "equipe", "orcamento", "chat"] as const
export type TabKey = (typeof TABS)[number]

export const TAB_KEYS: Record<TabKey, string> = {
  visaoGeral: "obra.tabs.visaoGeral",
  etapas: "obra.tabs.etapas",
  equipe: "obra.tabs.equipe",
  orcamento: "obra.tabs.orcamento",
  chat: "obra.tabs.chat",
}
